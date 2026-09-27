import fs from "node:fs";
import os from "node:os";
import express from "express";
import { WebSocketServer } from "ws";
import { Repo } from "@automerge/automerge-repo";
import { WebSocketServerAdapter } from "@automerge/automerge-repo-network-websocket";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import { readToken, requestPath, tokenMatches } from "./auth.js";

const PORT = Number(process.env.PORT || 3030);
const DATA_DIR = process.env.DATA_DIR || ".verger-sync";
const SYNC_TOKEN = process.env.VERGER_SYNC_TOKEN || "";

if (!SYNC_TOKEN || SYNC_TOKEN.length < 24) {
  console.error("VERGER_SYNC_TOKEN doit être défini avec au moins 24 caractères.");
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });
const socketServer = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 * 1024 });
const app = express();
const httpServer = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Verger Sync écoute sur le port ${PORT}`);
});

const repo = new Repo({
  network: [new WebSocketServerAdapter(socketServer, 60_000)],
  storage: new NodeFSStorageAdapter(DATA_DIR),
  peerId: `verger-sync-${os.hostname()}`,
  // Le serveur ne propose jamais spontanément ses documents : un client doit
  // déjà connaître l'identifiant Automerge du document qu'il demande.
  sharePolicy: async () => false,
});

app.disable("x-powered-by");
app.get("/health", (_request, response) => response.json({ ok: true, service: "verger-sync" }));
app.get("/", (_request, response) => response.type("text/plain").send("Verger Sync\n"));

httpServer.on("upgrade", (request, socket, head) => {
  const host = request.headers.host || "localhost";
  if (requestPath(request.url, host) !== "/sync" || !tokenMatches(readToken(request.url, host), SYNC_TOKEN)) {
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  socketServer.handleUpgrade(request, socket, head, (webSocket) => {
    socketServer.emit("connection", webSocket, request);
  });
});

async function shutdown(signal) {
  console.log(`${signal}: arrêt de Verger Sync`);
  socketServer.close();
  httpServer.close();
  await repo.flush?.();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
