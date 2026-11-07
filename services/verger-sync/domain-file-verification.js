import https from "node:https";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

export const VERIFICATION_FILE_PATH = "/verger-verification.txt";
const MAX_BYTES = 2048;
const REQUEST_TIMEOUT_MS = 6000;

const blocked4 = new BlockList();
for (const [address, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
]) blocked4.addSubnet(address, bits, "ipv4");

const blocked6 = new BlockList();
for (const [address, bits] of [
  ["2001::", 32], ["2001:db8::", 32], ["2002::", 16],
]) blocked6.addSubnet(address, bits, "ipv6");

/** Reject internal/reserved targets, including IPv4-mapped IPv6 addresses. */
export function isPublicAddress(address) {
  if (isIP(address) === 4) return !blocked4.check(address, "ipv4");
  if (isIP(address) === 6) {
    // Only globally routed unicast space (2000::/3). No local, multicast or mapped IPs.
    const first = Number.parseInt(address.split(":")[0], 16);
    return Number.isFinite(first) && first >= 0x2000 && first <= 0x3fff
      && !blocked6.check(address, "ipv6");
  }
  return false;
}

export function selectPublicAddress(records) {
  if (!Array.isArray(records) || records.length === 0
      || records.some(record => !record || !isPublicAddress(record.address))) {
    throw new Error("verification_target_not_public");
  }
  const selected = records.find(record => record.family === 4) || records[0];
  return { address: selected.address, family: isIP(selected.address) };
}

/** Public HTTPS only. Resolve once, pin the validated IP for the TLS request,
 * keep hostname for certificate validation/SNI, reject redirects and cap bytes. */
export async function readVerificationFile(domain, {
  dnsLookup = lookup,
  httpsRequest = https.request,
} = {}) {
  const records = await dnsLookup(domain, { all: true, verbatim: true });
  const resolved = selectPublicAddress(records);
  const url = new URL("https://" + domain + VERIFICATION_FILE_PATH);
  return await new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    const req = httpsRequest(url, {
      method: "GET",
      agent: false,
      timeout: REQUEST_TIMEOUT_MS,
      autoSelectFamily: false,
      rejectUnauthorized: true,
      lookup: (_hostname, _options, callback) =>
        callback(null, resolved.address, resolved.family),
      headers: { "Accept": "text/plain", "User-Agent": "Verger-Domain-Verification/1.0" },
    }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error("verification_http_status_" + response.statusCode));
        return;
      }
      response.on("data", chunk => {
        total += chunk.length;
        if (total > MAX_BYTES) {
          req.destroy(new Error("verification_file_too_large"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      response.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("verification_timeout")));
    req.on("error", reject);
    req.end();
  });
}
