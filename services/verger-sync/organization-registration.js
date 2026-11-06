import { randomUUID } from "node:crypto";
import { readVerificationFile, VERIFICATION_FILE_PATH } from "./domain-file-verification.js";
import { resolveTxt } from "node:dns/promises";
import { isIP } from "node:net";
import { domainToASCII } from "node:url";
import { transaction } from "./authority-db.js";
import { hashSecret, randomSecret } from "./authority-security.js";
import { AuthorityError, createOrganization, createAccount, createSession } from "./consultations-service.js";

const TTL_MS = 60 * 60 * 1000;
const MODULES = new Set(["members", "welcome", "meetings", "decisions", "actions", "events", "volunteers", "help", "ideas", "resources", "consultations", "chat"]);
const fail = (status, code, message) => { throw new AuthorityError(status, code, message); };
const now = () => new Date().toISOString();

export function normalizeDomain(input) {
  let raw = String(input || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!raw || /[/?#@: ]/.test(raw) || raw.length > 253) fail(400, "invalid_domain", "Saisissez uniquement un nom de domaine, par exemple association.fr");
  raw = domainToASCII(raw);
  if (!raw || isIP(raw)) fail(400, "invalid_domain", "Nom de domaine invalide");
  const labels = raw.split(".");
  if (labels.length < 2 || labels.some(x => x.length < 1 || x.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x)) || labels.at(-1).length < 2) {
    fail(400, "invalid_domain", "Nom de domaine invalide");
  }
  if (["localhost", "local", "invalid", "example", "test"].includes(labels.at(-1))) {
    fail(400, "invalid_domain", "Utilisez un vrai domaine publié sur Internet");
  }
  return raw;
}

function ensureUnclaimed(db, domain) {
  if (db.prepare("SELECT id FROM organizations WHERE domain = ?").get(domain)) {
    fail(409, "domain_claimed", "Ce nom de domaine a déjà été associé à une association");
  }
}

export function startDomainVerification(db, rawDomain) {
  const domain = normalizeDomain(rawDomain);
  ensureUnclaimed(db, domain);
  // Éliminer les anciens défis sans bloquer le domaine d'autrui.
  db.prepare("DELETE FROM domain_verifications WHERE expires_at < ?").run(now());
  const id = randomUUID();
  const token = randomSecret(32);
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  db.prepare("INSERT INTO domain_verifications (id, domain, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, domain, hashSecret(token), expiresAt, now());
  return {
    challengeId: id, domain, expiresAt,
    dnsType: "TXT", dnsName: "_verger." + domain,
    dnsValue: "verger-domain-verification=" + token,
    fileName: "verger-verification.txt",
    filePath: VERIFICATION_FILE_PATH,
    fileUrl: "https://" + domain + VERIFICATION_FILE_PATH,
    fileContents: "verger-domain-verification=" + token + "\n",
  };
}

export async function completeDomainVerification(db, payload, { dnsResolver = resolveTxt, fileReader = readVerificationFile } = {}) {
  const challengeId = String(payload.challengeId || "");
  const challenge = db.prepare("SELECT * FROM domain_verifications WHERE id = ?").get(challengeId);
  if (!challenge || challenge.used_at || challenge.expires_at <= now()) {
    fail(410, "verification_expired", "Vérification expirée : recommencez pour obtenir un nouveau code");
  }
  if (challenge.attempts >= 20) fail(429, "verification_attempts", "Trop d'essais : générez un nouveau code");
  db.prepare("UPDATE domain_verifications SET attempts = attempts + 1 WHERE id = ?").run(challengeId);
  const domain = challenge.domain;
  ensureUnclaimed(db, domain);

  const name = String(payload.name || "").trim().slice(0, 180);
  const description = String(payload.description || "").trim().slice(0, 1000);
  const color = String(payload.themeColor || "#315f3a").trim();
  const modules = Array.isArray(payload.modules) ? [...new Set(payload.modules)] : [...MODULES];
  if (!name) fail(400, "invalid_organization", "Nom de l'association obligatoire");
  if (!/^#[\da-fA-F]{6}$/.test(color)) fail(400, "invalid_theme", "Couleur invalide");
  if (modules.some(m => !MODULES.has(m))) fail(400, "invalid_modules", "Liste de modules invalide");
  if (!String(payload.email || "").includes("@")) fail(400, "invalid_email", "Adresse e-mail invalide");
  if (String(payload.password || "").length < 12) fail(400, "invalid_password", "Mot de passe : au moins 12 caractères");

  const method = payload.method === undefined ? "dns" : String(payload.method || "");
  if (!["dns", "file"].includes(method)) {
    fail(400, "invalid_verification_method", "Choisissez DNS TXT ou fichier HTTPS");
  }
  const expected = "verger-domain-verification=" + String(payload.dnsValue || "").replace(/^verger-domain-verification=/, "");
  const token = expected.slice("verger-domain-verification=".length);
  if (!token || token.length > 128 || hashSecret(token) !== challenge.token_hash) {
    fail(409, "invalid_verification_token", "Ce code ne correspond pas à la demande en cours");
  }

  if (method === "dns") {
    let entries;
    try { entries = await dnsResolver("_verger." + domain); }
    catch (error) {
      if (["ENOTFOUND", "ENODATA", "NXDOMAIN"].includes(error?.code)) entries = [];
      else fail(503, "dns_unavailable", "Vérification DNS temporairement indisponible, réessayez");
    }
    if (!Array.isArray(entries) || !entries.some(parts => Array.isArray(parts) && parts.join("") === expected)) {
      fail(409, "dns_not_verified", "Enregistrement TXT introuvable ou incorrect. Sa propagation peut prendre un peu de temps.");
    }
  } else {
    let contents;
    try { contents = await fileReader(domain); }
    catch {
      fail(409, "file_not_available", "Fichier inaccessible : vérifiez le chemin exact, le certificat HTTPS et les éventuelles redirections.");
    }
    if (typeof contents !== "string" || contents.trim() !== expected) {
      fail(409, "file_not_verified", "Le fichier HTTPS est absent ou ne contient pas le code de vérification attendu.");
    }
  }

  return transaction(db, () => {
    const latest = db.prepare("SELECT * FROM domain_verifications WHERE id = ?").get(challengeId);
    if (!latest || latest.used_at || latest.expires_at <= now()) fail(410, "verification_expired", "Code expiré ou déjà utilisé");
    ensureUnclaimed(db, domain);
    const organizationId = createOrganization(db, { name });
    db.prepare("UPDATE organizations SET domain = ?, domain_verified_at = ?, description = ?, theme_color = ?, modules_json = ? WHERE id = ?")
      .run(domain, now(), description, color, JSON.stringify(modules), organizationId);
    const account = createAccount(db, {
      organizationId, email: payload.email, password: payload.password, role: "administrator",
    });
    db.prepare("UPDATE domain_verifications SET used_at = ? WHERE id = ?").run(now(), challengeId);
    const session = createSession(db, account);
    return {
      account,
      organization: { id: organizationId, name, description, domain, domainVerified: true, themeColor: color, modules },
      session,
    };
  });
}
