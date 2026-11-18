import { execFile } from "node:child_process";
import { transaction } from "./authority-db.js";
import { hashPassword, hashSecret, randomSecret } from "./authority-security.js";
import { AuthorityError } from "./consultations-service.js";
import { normalizeDomain } from "./organization-registration.js";

const lifetime = 30 * 60 * 1000;
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const invalidReset = () => new AuthorityError(400, "invalid_reset", "Code invalide ou expiré");

export function sendResetEmail(from, { email, code }) {
  const sender = String(from || "").trim();
  if (![sender, email].every(address => emailPattern.test(address))) {
    throw new Error("Adresse de récupération invalide");
  }
  return new Promise((resolve, reject) => {
    const child = execFile("/usr/sbin/sendmail", ["-oi", "-t"], { timeout: 10000 }, error => {
      if (error) reject(error);
      else resolve();
    });
    child.stdin.on("error", reject);
    child.stdin.end([
      "From: " + sender, "To: " + email, "Subject: Verger Associations - code de recuperation",
      "Content-Type: text/plain; charset=UTF-8", "",
      "Saisissez ce code dans l'application Verger Associations :",
      code, "", "Ce code expire dans 30 minutes.", "",
    ].join("\r\n"));
  });
}

export function requestPasswordReset(db, { domain, email }, now = Date.now()) {
  const address = String(email || "").trim().toLowerCase();
  if (address.length > 254 || !emailPattern.test(address)) return null;
  const code = randomSecret(24);
  return transaction(db, () => {
    const account = db.prepare(`SELECT a.id, a.email FROM accounts a JOIN organizations o ON o.id = a.organization_id
      WHERE o.domain = ? AND o.domain_verified_at IS NOT NULL AND a.email = ? AND a.active = 1`)
      .get(normalizeDomain(domain), address);
    if (!account) return null;
    // Keep a still-valid message usable instead of invalidating it on every request.
    const result = db.prepare(`INSERT INTO password_resets (account_id, token_hash, expires_at)
      VALUES (?, ?, ?) ON CONFLICT(account_id) DO UPDATE
      SET token_hash = excluded.token_hash, expires_at = excluded.expires_at
      WHERE password_resets.expires_at <= ?`).run(account.id, hashSecret(code), now + lifetime, now);
    return result.changes ? { email: account.email, code } : null;
  });
}

export function resetPassword(db, { code, password }, now = Date.now()) {
  const token = String(code || "").trim();
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) throw invalidReset();
  if (typeof password !== "string" || password.length < 12 || password.length > 1024) {
    throw new AuthorityError(400, "invalid_password", "Le mot de passe doit contenir entre 12 et 1 024 caractères");
  }
  transaction(db, () => {
    const row = db.prepare(`SELECT r.account_id FROM password_resets r JOIN accounts a ON a.id = r.account_id
      WHERE r.token_hash = ? AND r.expires_at > ? AND a.active = 1`).get(hashSecret(token), now);
    if (!row) throw invalidReset();
    db.prepare("UPDATE accounts SET password_hash = ? WHERE id = ?").run(hashPassword(password), row.account_id);
    db.prepare("DELETE FROM password_resets WHERE account_id = ?").run(row.account_id);
    db.prepare("DELETE FROM sessions WHERE account_id = ?").run(row.account_id);
  });
}
