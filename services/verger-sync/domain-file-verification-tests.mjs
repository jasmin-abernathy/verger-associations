import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import { isPublicAddress, selectPublicAddress, readVerificationFile, VERIFICATION_FILE_PATH } from "./domain-file-verification.js";

test("Only public IP addresses are accepted before HTTPS request", () => {
  for (const address of [
    "127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.1.1",
    "100.64.0.1", "192.0.2.45", "198.51.100.12", "203.0.113.5",
    "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "2001:db8::2",
  ]) {
    assert.equal(isPublicAddress(address), false, address);
    assert.throws(() => selectPublicAddress([{ address, family: address.includes(":") ? 6 : 4 }]));
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
  assert.equal(selectPublicAddress([{ address: "8.8.8.8", family: 4 }]).address, "8.8.8.8");
  assert.throws(() => selectPublicAddress([
    { address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 },
  ]), /verification_target_not_public/);
});

function mockHttps(code, body, onOptions = () => {}) {
  return (url, options, onResponse) => {
    onOptions(url, options);
    const req = new EventEmitter();
    req.end = () => {
      const response = new EventEmitter();
      response.statusCode = code;
      response.resume = () => {};
      onResponse(response);
      if (code === 200) {
        response.emit("data", Buffer.from(body));
        response.emit("end");
      }
    };
    req.destroy = error => req.emit("error", error);
    return req;
  };
}

test("HTTPS proof uses fixed path, pinned validated IP, valid TLS and no redirect", async () => {
  assert.equal(VERIFICATION_FILE_PATH, "/verger-verification.txt");
  const expected = "verger-domain-verification=random-token\n";
  const actual = await readVerificationFile("association.fr", {
    dnsLookup: async (domain, opts) => {
      assert.equal(domain, "association.fr");
      assert.equal(opts.all, true);
      return [{ address: "8.8.8.8", family: 4 }];
    },
    httpsRequest: mockHttps(200, expected, (url, options) => {
      assert.equal(url.toString(), "https://association.fr/verger-verification.txt");
      assert.equal(options.rejectUnauthorized, true);
      assert.equal(options.agent, false);
      assert.equal(options.method, "GET");
      assert.equal(options.timeout, 6000);
      options.lookup("association.fr", {}, (error, address, family) => {
        assert.equal(error, null);
        assert.equal(address, "8.8.8.8");
        assert.equal(family, 4);
      });
    }),
  });
  assert.equal(actual, expected);
  await assert.rejects(readVerificationFile("association.fr", {
    dnsLookup: async () => [{ address: "8.8.8.8", family: 4 }],
    httpsRequest: mockHttps(302, ""),
  }), /verification_http_status_302/);
  await assert.rejects(readVerificationFile("association.fr", {
    dnsLookup: async () => [{ address: "127.0.0.1", family: 4 }],
    httpsRequest: () => { throw Error("must never open socket"); },
  }), /verification_target_not_public/);
  await assert.rejects(readVerificationFile("association.fr", {
    dnsLookup: async () => [{ address: "8.8.8.8", family: 4 }],
    httpsRequest: mockHttps(200, "x".repeat(2049)),
  }), /verification_file_too_large/);
});
