import { Repo, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { createInitialState, ensureState, touch } from "./domain.js";
import { getSyncToken, getSyncUrl, saveServerSettings } from "./platform.js";

export const STORAGE_KEYS = Object.freeze({
  rootDoc: "verger-root-doc-v03",
  syncUrl: "verger-sync-url-v03",
  syncToken: "verger-sync-token-v03",
  accessible: "verger-accessible-v03",
});

export const syncUrl = getSyncUrl();
export const syncToken = getSyncToken();

const network = [new BroadcastChannelNetworkAdapter({ channelName: "verger-associations-v03" })];
if (syncUrl) network.push(new WebSocketClientAdapter(withSyncToken(syncUrl, syncToken)));

export const repo = new Repo({
  storage: new IndexedDBStorageAdapter("verger-associations-v03"),
  network,
});

const publicPollMode = new URLSearchParams(document.location.search).has("publicPoll");
const sharedDoc = publicPollMode ? "" : document.location.hash.slice(1);
const requestedDoc = sharedDoc || localStorage.getItem(STORAGE_KEYS.rootDoc) || "";
export let handle;
if (sharedDoc && !isValidAutomergeUrl(sharedDoc)) {
  throw new Error("Lien de document invalide. Vérifiez le lien reçu.");
}
try {
  if (isValidAutomergeUrl(requestedDoc)) handle = await repo.find(requestedDoc);
} catch (error) {
  if (sharedDoc) throw new Error("Document partagé indisponible. Vérifiez la connexion et le jeton de synchronisation.", { cause: error });
  if (requestedDoc) throw new Error("Document local indisponible. Ne videz pas les données du navigateur ; vérifiez votre sauvegarde et la connexion.", { cause: error });
}
if (sharedDoc && (!handle || !handle.doc())) throw new Error("Document partagé introuvable. Vérifiez la connexion et le jeton de synchronisation.");
if (requestedDoc && (!handle || !handle.doc())) throw new Error("Document enregistré introuvable. Vérifiez votre sauvegarde avant de créer un nouvel espace.");
if (!handle) {
  handle = repo.create();
  handle.change((doc) => Object.assign(doc, createInitialState()));
}
if (!publicPollMode) {
  localStorage.setItem(STORAGE_KEYS.rootDoc, handle.url);
  document.location.hash = handle.url;
}
handle.change((doc) => ensureState(doc));

export function currentDoc() {
  return handle.doc();
}

export function changeDoc(callback) {
  handle.change((draft) => {
    ensureState(draft);
    callback(draft);
    touch(draft);
  });
}

export function openImportedDocument(data) {
  const imported = repo.create();
  imported.change((draft) => Object.assign(draft, data));
  imported.change((draft) => ensureState(draft));
  handle = imported;
  localStorage.setItem(STORAGE_KEYS.rootDoc, handle.url);
  document.location.hash = handle.url;
  return handle;
}

export function saveSyncSettings(url, token) {
  saveServerSettings({ syncUrl: url, syncToken: token });
}

function withSyncToken(rawUrl, token) {
  try {
    const url = new URL(rawUrl);
    if (token) url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return rawUrl;
  }
}
