import assert from "node:assert/strict";
import { test } from "node:test";
import { openAuthorityDatabase } from "./authority-db.js";
import { authenticateAccount, createAccount, createSession, accountFromSessionToken, createOrganization } from "./consultations-service.js";
import { requestPasswordReset, resetPassword } from "./password-reset.js";

test("Recovery requires an active account in the verified domain and consumes the code", () => {
  const db = openAuthorityDatabase(":memory:");
  try {
    const organizationId = createOrganization(db, { name: "Association" });
    db.prepare("UPDATE organizations SET domain = ?, domain_verified_at = ? WHERE id = ?")
      .run("association-test.fr", new Date().toISOString(), organizationId);
    const email = "presidence@association-test.fr";
    const password = "ancien-mot-de-passe";
    const account = createAccount(db, { organizationId, email, password, role: "administrator" });
    const session = createSession(db, account);
    const now = Date.now();
    assert.equal(requestPasswordReset(db, { domain: "autre-test.fr", email }, now), null);
    assert.equal(requestPasswordReset(db, { domain: "association-test.fr", email: "unknown@association-test.fr" }, now), null);
    const { code } = requestPasswordReset(db, { domain: "association-test.fr", email }, now);
    assert.notEqual(db.prepare("SELECT token_hash FROM password_resets").get().token_hash, code);
    assert.equal(requestPasswordReset(db, { domain: "association-test.fr", email }, now + 1), null);
    assert.throws(() => resetPassword(db, { code, password: "trop-court" }, now), /12/);
    assert.throws(() => resetPassword(db, { code, password: "nouveau-mot-de-passe" }, now + 30 * 60 * 1000), /expiré/);
    resetPassword(db, { code, password: "nouveau-mot-de-passe" }, now + 1);
    assert.throws(() => resetPassword(db, { code, password }, now + 2), /expiré/);
    assert.equal(accountFromSessionToken(db, session.token), null);
    assert.throws(() => authenticateAccount(db, { organizationId, email, password }), /invalides/);
    assert.equal(authenticateAccount(db, { organizationId, email, password: "nouveau-mot-de-passe" }).id, account.id);
  } finally {
    db.close();
  }
});
