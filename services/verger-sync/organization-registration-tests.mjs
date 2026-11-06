import assert from "node:assert/strict";
import { test } from "node:test";
import { openAuthorityDatabase } from "./authority-db.js";
import { startDomainVerification, completeDomainVerification, normalizeDomain } from "./organization-registration.js";

test("le domaine est validé uniquement par DNS et crée un compte admin", async () => {
  const db = openAuthorityDatabase(":memory:");
  try {
    const ch = startDomainVerification(db, "https://association.fr/");
    assert.equal(ch.dnsName, "_verger.association.fr");
    assert.equal(ch.dnsType, "TXT");
    assert.throws(() => normalizeDomain("127.0.0.1"));
    assert.throws(() => normalizeDomain("example.test"));
    const input = {
      challengeId: ch.challengeId, dnsValue: ch.dnsValue,
      name: "L'association", email: "bureau@association.fr",
      password: "password-test-123456", description: "Bienvenue",
      themeColor: "#306080", modules: ["members","chat"],
    };
    await assert.rejects(
      completeDomainVerification(db, input, { dnsResolver: async () => [] }),
      error => error.status === 409,
    );
    const result = await completeDomainVerification(db, input, { dnsResolver: async host => {
      assert.equal(host, "_verger.association.fr");
      return [[ch.dnsValue.slice(0, 24), ch.dnsValue.slice(24)]];
    }});
    assert.equal(result.account.role, "administrator");
    assert.equal(result.organization.domain, "association.fr");
    assert.deepEqual(result.organization.modules, ["members","chat"]);
    const row = db.prepare("SELECT * FROM organizations WHERE id = ?").get(result.organization.id);
    assert.ok(row.domain_verified_at);
    assert.throws(() => startDomainVerification(db, "association.fr"), error => error.status === 409);
    await assert.rejects(
      completeDomainVerification(db, input, { dnsResolver: async () => [[ch.dnsValue]] }),
      error => error.status === 410,
    );
  } finally { db.close(); }
});

test("chaque domaine utilise un défi unique, non réutilisable", async () => {
  const db = openAuthorityDatabase(":memory:");
  try {
    const first = startDomainVerification(db, "asso.fr");
    const second = startDomainVerification(db, "asso.fr");
    assert.notEqual(first.dnsValue, second.dnsValue);
    await assert.rejects(completeDomainVerification(db, {
      challengeId: first.challengeId, dnsValue: second.dnsValue,
      name: "Association", email: "a@asso.fr", password: "something-very-long",
    }, { dnsResolver: async () => [[first.dnsValue]] }), error => error.status === 409);
  } finally { db.close(); }
});
