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


test("l'association peut être vérifiée par fichier HTTPS sans TXT DNS", async () => {
  const db = openAuthorityDatabase(":memory:");
  try {
    const challenge = startDomainVerification(db, "association.fr");
    assert.equal(challenge.fileName, "verger-verification.txt");
    assert.equal(challenge.fileUrl, "https://association.fr/verger-verification.txt");
    assert.equal(challenge.fileContents, challenge.dnsValue + "\n");
    const data = {
      challengeId: challenge.challengeId,
      dnsValue: challenge.dnsValue,
      method: "file",
      name: "Association du quartier",
      email: "contact@association.fr",
      password: "motdepasse-long-123456",
      themeColor: "#315f3a",
    };
    let checked = 0;
    await assert.rejects(
      completeDomainVerification(db, data, {
        dnsResolver: () => { throw Error("Do not query DNS TXT when file mode selected"); },
        fileReader: async domain => {
          checked++;
          assert.equal(domain, "association.fr");
          return "verger-domain-verification=incorrect\n";
        },
      }),
      e => e.status === 409 && e.code === "file_not_verified",
    );
    const result = await completeDomainVerification(db, data, {
      fileReader: async domain => {
        checked++;
        assert.equal(domain, "association.fr");
        return challenge.fileContents;
      },
    });
    assert.equal(checked, 2);
    assert.equal(result.account.role, "administrator");
    assert.equal(result.organization.domainVerified, true);
    assert.throws(() => startDomainVerification(db, "association.fr"), e => e.status === 409);
  } finally { db.close(); }
});

test("la vérification HTTPS refuse les erreurs de réseau et les méthodes inconnues", async () => {
  const db = openAuthorityDatabase(":memory:");
  try {
    const ch = startDomainVerification(db, "asso.fr");
    const input = {
      challengeId: ch.challengeId, dnsValue: ch.dnsValue,
      name: "Association", email: "admin@asso.fr", password: "very-long-password-123",
      method: "invalid",
    };
    await assert.rejects(completeDomainVerification(db, input), e => e.status === 400);
    input.method = "file";
    await assert.rejects(
      completeDomainVerification(db, input, { fileReader: async () => { throw Error("ECONNREFUSED"); } }),
      e => e.status === 409 && e.code === "file_not_available",
    );
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM organizations WHERE domain = ?").get("asso.fr").total, 0);
  } finally { db.close(); }
});
