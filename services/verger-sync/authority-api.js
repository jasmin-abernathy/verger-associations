import express from "express";
import {
  acceptInvitation,
  accountFromSessionToken,
  authenticateAccount,
  cancelPoll,
  closePoll,
  createInvitation,
  createPoll,
  createSession,
  getPoll,
  listPolls,
  memberResults,
  publicResults,
  revokeSession,
  saveResponse,
  updatePollBeforeResponses,
} from "./consultations-service.js";
import { parseCookies } from "./authority-security.js";

const COOKIE = "verger_session";

export function mountAuthorityApi(app, { db, cookieSecure = true, allowedOrigins = [], nativeOrigins = [] }) {
  const mutationOrigins = [...new Set([...allowedOrigins, ...nativeOrigins])];

  app.use("/api/v1", (request, response, next) => {
    const origin = normalizedOrigin(request.headers.origin);
    if (origin && nativeOrigins.includes(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.setHeader("Access-Control-Max-Age", "600");
      if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
      }
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !sameOrigin(request, mutationOrigins)) {
      response.status(403).json({ error: "origin_rejected", message: "Origine de requête refusée" });
      return;
    }
    next();
  });
  app.use("/api/v1", express.json({ limit: "64kb" }));

  app.post("/api/v1/login", (request, response, next) => {
    try {
      const account = authenticateAccount(db, request.body || {});
      const session = createSession(db, account);
      setSessionCookie(response, session.token, session.expiresAt, cookieSecure);
      response.json({ account });
    } catch (error) { next(error); }
  });

  app.post("/api/v1/native/login", requireNativeOrigin(nativeOrigins), (request, response, next) => {
    try {
      const account = authenticateAccount(db, request.body || {});
      const session = createSession(db, account);
      response.json({ account, sessionToken: session.token, expiresAt: session.expiresAt });
    } catch (error) { next(error); }
  });

  app.post("/api/v1/logout", withSession(db), (request, response, next) => {
    try {
      revokeSession(db, request.sessionToken);
      if (request.sessionKind === "cookie") clearSessionCookie(response, cookieSecure);
      response.json({ ok: true });
    } catch (error) { next(error); }
  });

  app.get("/api/v1/session", withSession(db), (request, response) => {
    response.json({ account: request.account });
  });

  app.post("/api/v1/invitations", withSession(db), (request, response, next) => {
    try {
      const invitation = createInvitation(db, request.account, request.body || {});
      response.status(201).json(invitation);
    } catch (error) { next(error); }
  });

  app.post("/api/v1/invitations/accept", (request, response, next) => {
    try {
      const account = acceptInvitation(db, request.body || {});
      const session = createSession(db, account);
      setSessionCookie(response, session.token, session.expiresAt, cookieSecure);
      response.status(201).json({ account });
    } catch (error) { next(error); }
  });

  app.post("/api/v1/native/invitations/accept", requireNativeOrigin(nativeOrigins), (request, response, next) => {
    try {
      const account = acceptInvitation(db, request.body || {});
      const session = createSession(db, account);
      response.status(201).json({ account, sessionToken: session.token, expiresAt: session.expiresAt });
    } catch (error) { next(error); }
  });

  app.get("/api/v1/polls", withSession(db), (request, response, next) => {
    try { response.json({ polls: listPolls(db, request.account) }); }
    catch (error) { next(error); }
  });

  app.post("/api/v1/polls", withSession(db), (request, response, next) => {
    try { response.status(201).json({ poll: createPoll(db, request.account, request.body || {}) }); }
    catch (error) { next(error); }
  });

  app.get("/api/v1/polls/:pollId", withSession(db), (request, response, next) => {
    try { response.json({ poll: getPoll(db, request.account, request.params.pollId) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/v1/polls/:pollId", withSession(db), (request, response, next) => {
    try {
      response.json({ poll: updatePollBeforeResponses(db, request.account, request.params.pollId, request.body || {}) });
    } catch (error) { next(error); }
  });

  app.put("/api/v1/polls/:pollId/response", withSession(db), (request, response, next) => {
    try {
      response.json(saveResponse(db, request.account, request.params.pollId, request.body?.optionId));
    } catch (error) { next(error); }
  });

  app.post("/api/v1/polls/:pollId/close", withSession(db), (request, response, next) => {
    try { response.json({ results: closePoll(db, request.account, request.params.pollId) }); }
    catch (error) { next(error); }
  });

  app.post("/api/v1/polls/:pollId/cancel", withSession(db), (request, response, next) => {
    try { response.json(cancelPoll(db, request.account, request.params.pollId, request.body?.reason)); }
    catch (error) { next(error); }
  });

  app.get("/api/v1/polls/:pollId/results", withSession(db), (request, response, next) => {
    try { response.json({ results: memberResults(db, request.account, request.params.pollId) }); }
    catch (error) { next(error); }
  });

  app.get("/api/v1/public/polls/:pollId/results", (request, response, next) => {
    try {
      response.set("Cache-Control", "public, max-age=60");
      response.json({ results: publicResults(db, request.params.pollId) });
    } catch (error) { next(error); }
  });

  app.use("/api/v1", (error, _request, response, _next) => {
    const status = Number(error?.status) || 500;
    if (status >= 500) console.error(error);
    response.status(status).json({
      error: error?.code || "internal_error",
      message: status >= 500 ? "Erreur interne" : error.message,
    });
  });
}

function withSession(db) {
  return (request, response, next) => {
    const session = sessionTokenFromRequest(request);
    const account = accountFromSessionToken(db, session.token);
    if (!account) {
      response.status(401).json({ error: "authentication_required", message: "Authentification requise" });
      return;
    }
    request.account = account;
    request.sessionToken = session.token;
    request.sessionKind = session.kind;
    next();
  };
}

export function sessionTokenFromRequest(request) {
  const authorization = String(request?.headers?.authorization || "").trim();
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (match?.[1]) return { token: match[1].trim(), kind: "bearer" };
  return {
    token: parseCookies(request?.headers?.cookie)[COOKIE] || "",
    kind: "cookie",
  };
}

function setSessionCookie(response, token, expiresAt, secure) {
  const parts = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ];
  if (secure) parts.push("Secure");
  response.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(response, secure) {
  const parts = [
    `${COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (secure) parts.push("Secure");
  response.setHeader("Set-Cookie", parts.join("; "));
}

function sameOrigin(request, allowedOrigins = []) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    if (allowedOrigins.includes(originUrl.origin)) return true;
    const forwardedHost = String(request.headers["x-forwarded-host"] || "").split(",")[0].trim();
    const host = forwardedHost || String(request.headers.host || "").trim();
    if (!host || originUrl.host !== host) return false;

    const forwardedProto = String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    if (forwardedProto) return originUrl.protocol === `${forwardedProto}:`;
    if (request.socket?.encrypted) return originUrl.protocol === "https:";

    // A local development/reverse proxy may terminate HTTPS before forwarding
    // the request over plain HTTP while preserving the original Host header.
    return true;
  } catch {
    return false;
  }
}


function requireNativeOrigin(nativeOrigins) {
  return (request, response, next) => {
    const origin = normalizedOrigin(request.headers.origin);
    if (!origin || !nativeOrigins.includes(origin)) {
      response.status(403).json({ error: "native_origin_rejected", message: "Origine native refusée" });
      return;
    }
    next();
  };
}

function normalizedOrigin(value) {
  if (!value) return "";
  try { return new URL(String(value)).origin; }
  catch { return ""; }
}
