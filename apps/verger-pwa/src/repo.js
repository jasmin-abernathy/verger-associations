import { Repo, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { createInitialState, ensureState, touch } from "./domain.js";

export const STORAGE_KEYS = Object.freeze({
  rootDoc: "verger-root-doc-v03",
  syncUrl: "verger-sync-url-v03",
  syncToken: "verger-sync-token-v03",
  accessible: "verger-accessible-v03",
});

export const syncUrl = localStorage.getItem(STORAGE_KEYS.syncUrl) || "";
export const syncToken = localStorage.getItem(STORAGE_KEYS.syncToken) || "";

const network = [new BroadcastChannelNetworkAdapter({ channelName: "verger-associations-v03" })];
if (syncUrl) network.push(new WebSocketClientAdapter(withSyncToken(syncUrl, syncToken)));

export const repo = new Repo({
  storage: new IndexedDBStorageAdapter("verger-associations-v03"),
  network,
});

const requestedDoc = document.location.hash.slice(1) || localStorage.getItem(STORAGE_KEYS.rootDoc) || "";
export let handle;
try {
  if (isValidAutomergeUrl(requestedDoc)) handle = await repo.find(requestedDoc);
} catch (error) {
  console.warn("Document Verger indisponible, création d’un espace local.", error);
}
if (!handle) {
  handle = repo.create();
  handle.change((doc) => Object.assign(doc, createInitialState()));
}
localStorage.setItem(STORAGE_KEYS.rootDoc, handle.url);
document.location.hash = handle.url;
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

export function saveSyncSettings(url, token) {
  localStorage.setItem(STORAGE_KEYS.syncUrl, String(url || "").trim());
  localStorage.setItem(STORAGE_KEYS.syncToken, String(token || "").trim());
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
