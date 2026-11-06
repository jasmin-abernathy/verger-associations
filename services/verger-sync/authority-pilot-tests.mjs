import assert from "node:assert/strict";
import { test } from "node:test";
import { openAuthorityDatabase } from "./authority-db.js";
import { createAuthorityPilotApp } from "./authority-pilot.js";

test("Pilot only allows chosen domain, without opening sync or registering anyone", async () => {
  const db = openAuthorityDatabase(":memory:");
  const app = createAuthorityPilotApp({
    db,
    registrationDomains: ["asso-aldebaran.fr"],
    allowedOrigins: ["https://app.lepotager.org"],
    nativeOrigins: ["https://appassets.androidplatform.net"],
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const start = domain => fetch(base + "/api/v1/organizations/verification/start", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://appassets.androidplatform.net" },
    body: JSON.stringify({ domain }),
  });
  try {
    const health = await (await fetch(base + "/health")).json();
    assert.equal(health.ok, true);
    assert.equal(health.syncProvisioned, false);
    const forbidden = await start("autre-asso.fr");
    assert.equal(forbidden.status, 403);
    const denied = await fetch(base + "/api/v1/organizations/verification/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://evil.invalid" },
      body: JSON.stringify({ domain: "asso-aldebaran.fr" }),
    });
    assert.equal(denied.status, 403);
    const started = await start("asso-aldebaran.fr");
    assert.equal(started.status, 201);
    const proof = await started.json();
    assert.equal(proof.domain, "asso-aldebaran.fr");
    assert.equal(proof.fileUrl, "https://asso-aldebaran.fr/verger-verification.txt");
    assert.match(proof.dnsValue, /^verger-domain-verification=/);
    assert.equal((await fetch(base + "/sync")).status, 404);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM organizations").get().count, 0);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});

test("Pilot refuses to run without explicit allowlist", () => {
  const db = openAuthorityDatabase(":memory:");
  try {
    assert.throws(() => createAuthorityPilotApp({ db, registrationDomains: [] }), /allowlist/);
  } finally {
    db.close();
  }
});
