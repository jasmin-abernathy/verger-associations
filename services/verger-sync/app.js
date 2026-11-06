import path from "node:path";
import express from "express";
import { openAuthorityDatabase } from "./authority-db.js";
import { createAuthorityPilotApp } from "./authority-pilot.js";

const databaseFile = String(process.env.VERGER_AUTH_DB || "");
const registrationDomains = String(process.env.VERGER_REGISTRATION_DOMAINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);
const allowedOrigins = String(process.env.VERGER_ALLOWED_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);
const nativeOrigins = String(process.env.VERGER_NATIVE_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);

if (!path.isAbsolute(databaseFile) || !registrationDomains.length || !nativeOrigins.length) {
  throw new Error("Pilote : définir VERGER_AUTH_DB (chemin absolu), VERGER_REGISTRATION_DOMAINS et VERGER_NATIVE_ORIGINS");
}

const db = openAuthorityDatabase(databaseFile);
const app = createAuthorityPilotApp({ db, registrationDomains, allowedOrigins, nativeOrigins });
const port = Number(process.env.PORT || 3000);
// CloudLinux Passenger retains /verger-api in request.url when mounting an app at a sub-URI.
const publicPath = String(process.env.VERGER_BASE_PATH || "/verger-api").trim();
if (!/^\/[a-z0-9/-]+$/.test(publicPath)) throw new Error("VERGER_BASE_PATH invalide");
const publicApp = express();
publicApp.use(publicPath, app);
const server = publicApp.listen(port, "0.0.0.0", () => {
  console.log("Verger pilot API ready");
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
