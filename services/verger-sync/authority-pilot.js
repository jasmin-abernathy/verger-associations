import express from "express";
import { mountAuthorityApi } from "./authority-api.js";
import { normalizeDomain } from "./organization-registration.js";

/** Isolated pilot: account/verification API only. Never starts a shared Automerge server. */
export function createAuthorityPilotApp({
  db,
  registrationDomains,
  allowedOrigins = [],
  nativeOrigins = [],
} = {}) {
  if (!db) throw new Error("Pilot database required");
  const allowedDomains = new Set((registrationDomains || []).map(domain => normalizeDomain(domain)));
  if (!allowedDomains.size) throw new Error("Explicit pilot registration allowlist required");

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((_request, response, next) => {
    response.set("X-Content-Type-Options", "nosniff");
    response.set("Cache-Control", "no-store");
    next();
  });

  app.post("/api/v1/organizations/verification/start", express.json({ limit: "8kb" }), (request, response, next) => {
    let domain;
    try { domain = normalizeDomain(request.body?.domain); }
    catch (error) {
      response.status(error?.status || 400).json({ error: error?.code || "invalid_domain", message: error?.message || "Domaine invalide" });
      return;
    }
    if (!allowedDomains.has(domain)) {
      response.status(403).json({
        error: "pilot_domain_restricted",
        message: "Pilote limité aux associations participantes. Inscription publique non ouverte.",
      });
      return;
    }
    next();
  });
  mountAuthorityApi(app, { db, cookieSecure: true, allowedOrigins, nativeOrigins });
  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "verger-authority-pilot", syncProvisioned: false });
  });
  app.get("/", (_request, response) => {
    response.type("text/plain").send("Verger Associations — API de test");
  });
  return app;
}
