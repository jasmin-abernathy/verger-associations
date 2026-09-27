import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const KEY_BYTES = 64;

export function hashPassword(password) {
  const value = String(password || "");
  if (value.length < 12) throw new Error("Le mot de passe doit contenir au moins 12 caractères");
  const salt = randomBytes(16);
  const derived = scryptSync(value, salt, KEY_BYTES);
  return `scrypt:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export function verifyPassword(password, encoded) {
  const [algorithm, saltText, hashText] = String(encoded || "").split(":");
  if (algorithm !== "scrypt" || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, "base64url");
  const actual = scryptSync(String(password || ""), Buffer.from(saltText, "base64url"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function randomSecret(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashSecret(secret) {
  return createHash("sha256").update(String(secret || "")).digest("hex");
}

export function parseCookies(header) {
  const result = {};
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      try { result[key] = decodeURIComponent(value); }
      catch { result[key] = value; }
    }
  }
  return result;
}
