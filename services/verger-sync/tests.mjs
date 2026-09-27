import assert from "node:assert/strict";
import { readToken, requestPath, tokenMatches } from "./auth.js";

assert.equal(requestPath("/sync?token=abc"), "/sync");
assert.equal(readToken("/sync?token=abc"), "abc");
assert.equal(tokenMatches("secret-value", "secret-value"), true);
assert.equal(tokenMatches("secret-value", "other-value"), false);
assert.equal(tokenMatches("", "secret-value"), false);
console.log("Tests Verger Sync : OK");
