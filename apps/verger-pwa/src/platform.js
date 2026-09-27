import { Capacitor } from "@capacitor/core";

const KEYS = Object.freeze({
  apiUrl: "verger-api-url-v04",
  publicWebUrl: "verger-public-web-url-v04",
  syncUrl: "verger-sync-url-v03",
  syncToken: "verger-sync-token-v03",
});

export const nativePlatform = Capacitor.isNativePlatform();
export const platformName = Capacitor.getPlatform();

export function getApiBaseUrl() {
  const configured = readLocal(KEYS.apiUrl) || String(import.meta.env.VITE_VERGER_API_URL || "").trim();
  if (configured) return normalizeApiBase(configured);
  return nativePlatform ? "" : "/api/v1";
}

export function getPublicWebUrl() {
  return stripTrailingSlash(
    readLocal(KEYS.publicWebUrl) || String(import.meta.env.VITE_VERGER_PUBLIC_URL || "").trim(),
  );
}

export function getSyncUrl() {
  return stripTrailingSlash(
    readLocal(KEYS.syncUrl) || String(import.meta.env.VITE_VERGER_SYNC_URL || "").trim(),
  );
}

export function getSyncToken() {
  return readLocal(KEYS.syncToken);
}

export function saveServerSettings(settings = {}) {
  if (Object.hasOwn(settings, "apiUrl")) writeLocal(KEYS.apiUrl, normalizeApiBase(settings.apiUrl));
  if (Object.hasOwn(settings, "publicWebUrl")) writeLocal(KEYS.publicWebUrl, stripTrailingSlash(settings.publicWebUrl));
  if (Object.hasOwn(settings, "syncUrl")) writeLocal(KEYS.syncUrl, stripTrailingSlash(settings.syncUrl));
  if (Object.hasOwn(settings, "syncToken")) writeLocal(KEYS.syncToken, String(settings.syncToken || "").trim());
}

export function nativeServerConfigured() {
  return !nativePlatform || Boolean(getApiBaseUrl());
}

function normalizeApiBase(value) {
  const raw = stripTrailingSlash(String(value || "").trim());
  if (!raw) return "";
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

function stripTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function readLocal(key) {
  try { return localStorage.getItem(key) || ""; }
  catch { return ""; }
}

function writeLocal(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}
