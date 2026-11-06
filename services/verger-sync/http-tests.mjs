import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { openAuthorityDatabase } from './authority-db.js';
import { mountAuthorityApi } from './authority-api.js';
import { createOrganization, createAccount } from './consultations-service.js';

test('HTTP: connexion, invitations, consultation et séparation des associations', async () => {
  const db = openAuthorityDatabase(':memory:');
  const app = express();
  mountAuthorityApi(app, { db, allowedOrigins: ['https://verger.example.test'], nativeOrigins: ['https://localhost'] });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  async function req(path, { method = 'GET', body, token, cookie, origin, raw } = {}) {
    const headers = {};
    if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cookie) headers.Cookie = cookie;
    if (origin) headers.Origin = origin;
    const r = await fetch(base + path, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
    return { status: r.status, headers: r.headers, data: r.status === 204 ? null : await r.json() };
  }
  try {
    for (const id of ['a', 'b']) {
      createOrganization(db, { id, name: id });
      createAccount(db, { organizationId: id, email: 'admin@example.test', password: 'test-password-1234', role: 'administrator' });
    }
    const credentials = { organizationId: 'a', email: 'admin@example.test', password: 'test-password-1234' };
    assert.equal((await req('/session')).status, 401);
    assert.equal((await req('/login', { method: 'POST', body: credentials, origin: 'https://evil.example' })).status, 403);
    assert.equal((await req('/native/login', { method: 'POST', body: credentials })).status, 403);
    const preflight = await req('/login', { method: 'OPTIONS', origin: 'https://verger.example.test' });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://verger.example.test');
    const web = await req('/login', { method: 'POST', body: credentials });
    assert.equal(web.status, 200);
    assert.match(web.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
    assert.match(web.headers.get('set-cookie'), /Secure/);
    assert.equal(web.headers.get('cache-control'), 'no-store');
    const cookie = web.headers.get('set-cookie').split(';')[0];
    assert.equal((await req('/session', { cookie })).data.account.organizationId, 'a');
    const native = await req('/native/login', { method: 'POST', body: credentials, origin: 'https://localhost' });
    assert.equal(native.status, 200);
    assert.equal(native.headers.get('set-cookie'), null);
    const token = native.data.sessionToken;
    assert.ok(token);
    const invitation = await req('/invitations', { method: 'POST', token, body: { email: 'member@example.test', role: 'member' } });
    assert.equal(invitation.status, 201);
    const invitationBody = { token: invitation.data.token, password: 'member-password-1234' };
    const accepted = await req('/native/invitations/accept', { method: 'POST', origin: 'https://localhost', body: invitationBody });
    assert.equal(accepted.status, 201);
    const member = accepted.data.sessionToken;
    assert.ok(member);
    assert.notEqual((await req('/native/invitations/accept', { method: 'POST', origin: 'https://localhost', body: invitationBody })).status, 201);
    const created = await req('/polls', { method: 'POST', token, body: { title: 'Réunion', question: 'Quel jour ?', options: ['Lundi', 'Mardi'], resultsVisibility: 'public_after_close' } });
    assert.equal(created.status, 201);
    const poll = created.data.poll;
    const other = await req('/native/login', { method: 'POST', origin: 'https://localhost', body: { ...credentials, organizationId: 'b' } });
    assert.equal((await req(`/polls/${poll.id}`, { token: other.data.sessionToken })).status, 404);
    assert.equal((await req(`/public/polls/${poll.id}/results`)).status, 404);
    for (const option of poll.options) assert.equal((await req(`/polls/${poll.id}/response`, { method: 'PUT', token: member, body: { optionId: option.id } })).status, 200);
    const current = await req(`/polls/${poll.id}`, { token: member });
    assert.equal(current.data.poll.responseCount, 1);
    assert.equal(current.data.poll.myOptionId, poll.options[1].id);
    assert.equal((await req(`/polls/${poll.id}/close`, { method: 'POST', token: member, body: {} })).status, 403);
    assert.equal((await req(`/polls/${poll.id}/close`, { method: 'POST', token, body: {} })).status, 200);
    const results = await req(`/public/polls/${poll.id}/results`);
    assert.equal(results.status, 200);
    assert.equal(results.data.results.total, 1);
    assert.equal(JSON.stringify(results.data).includes('member@example.test'), false);
    assert.equal((await req('/login', { method: 'POST', raw: '{"password":"DO_NOT_ECHO' })).data.message, 'Requête JSON invalide');
    assert.equal((await req('/missing')).data.error, 'route_not_found');
    await req('/logout', { method: 'POST', token, body: {} });
    assert.equal((await req('/session', { token })).status, 401);
    await req('/logout', { method: 'POST', cookie, body: {} });
    assert.equal((await req('/session', { cookie })).status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});


test("HTTP: inscription d'une association par preuve DNS et rôle administrateur", async () => {
  const db = openAuthorityDatabase(":memory:");
  let txt = [];
  const app = express();
  mountAuthorityApi(app, {
    db, allowedOrigins: ["https://verger.example.test"], nativeOrigins: ["https://localhost"],
    dnsResolver: async name => {
      assert.equal(name, "_verger.association.fr");
      return txt;
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port + "/api/v1";
  async function post(route, body, origin = "https://verger.example.test") {
    const res = await fetch(base + route, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json(), cookie: res.headers.get("set-cookie") };
  }
  try {
    const created = await post("/organizations/verification/start", { domain: "association.fr" });
    assert.equal(created.status, 201);
    assert.match(created.data.dnsValue, /^verger-domain-verification=/);
    const payload = {
      challengeId: created.data.challengeId, dnsValue: created.data.dnsValue,
      name: "Association test", email: "admin@association.fr", password: "password-very-long-123",
      themeColor: "#507060", modules: ["members", "chat"],
    };
    assert.equal((await post("/organizations/verification/complete", payload)).status, 409);
    txt = [[created.data.dnsValue]];
    const result = await post("/organizations/verification/complete", payload);
    assert.equal(result.status, 201);
    assert.equal(result.data.account.role, "administrator");
    assert.equal(result.data.organization.domainVerified, true);
    assert.equal(result.data.sessionToken, undefined);
    assert.match(result.cookie, /HttpOnly/);
    assert.equal((await post("/organizations/verification/start", { domain: "association.fr" })).status, 409);
    assert.equal((await post("/organizations/verification/complete", payload)).status, 410);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
