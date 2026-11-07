import { getApiBaseUrl, nativePlatform } from "./platform.js";

let nativeSessionToken = "";

export async function getSession() {
  if (nativePlatform && !nativeSessionToken) return { account: null };
  try {
    return await request("/session");
  } catch (error) {
    if (error.status === 401) {
      nativeSessionToken = "";
      return { account: null };
    }
    throw error;
  }
}

export async function login({ organizationId, email, password }) {
  const path = nativePlatform ? "/native/login" : "/login";
  const data = await request(path, { method: "POST", body: { organizationId, email, password }, authenticated: false });
  if (nativePlatform) nativeSessionToken = String(data.sessionToken || "");
  return data;
}

export async function logout() {
  try {
    if (nativePlatform && !nativeSessionToken) return { ok: true };
    return await request("/logout", { method: "POST", body: {} });
  } finally {
    if (nativePlatform) nativeSessionToken = "";
  }
}

export async function acceptInvitation({ token, password }) {
  const path = nativePlatform ? "/native/invitations/accept" : "/invitations/accept";
  const data = await request(path, { method: "POST", body: { token, password }, authenticated: false });
  if (nativePlatform) nativeSessionToken = String(data.sessionToken || "");
  return data;
}

export function beginDomainVerification(domain) {
  return request("/organizations/verification/start", {
    method: "POST", body: { domain }, authenticated: false,
  });
}

export async function completeDomainRegistration(payload) {
  const path = nativePlatform ? "/native/organizations/verification/complete" : "/organizations/verification/complete";
  const data = await request(path, { method: "POST", body: payload, authenticated: false });
  if (nativePlatform) nativeSessionToken = String(data.sessionToken || "");
  return data;
}

export function organizationByDomain(domain) {
  return request("/organizations/by-domain/" + encodeURIComponent(domain), { authenticated: false });
}
export function requestAssociationAccess({ domain, email, role, message = "" }) {
  return request("/access-requests", {method:"POST",authenticated:false,body:{domain,email,role,message}});
}
export function listAssociationAccessRequests() { return request("/access-requests"); }
export function approveAssociationAccessRequest(id) {
  return request("/access-requests/" + encodeURIComponent(id) + "/approve", {method:"POST",body:{}});
}
export function rejectAssociationAccessRequest(id) {
  return request("/access-requests/" + encodeURIComponent(id) + "/reject", {method:"POST",body:{}});
}

export function createInvitation({ email, role, memberId = null }) {
  return request("/invitations", { method: "POST", body: { email, role, memberId: memberId || null } });
}

export function listPolls() { return request("/polls"); }
export function getPoll(id) { return request(`/polls/${encodeURIComponent(id)}`); }

export function createPoll({ title, question, options, resultsVisibility, deadlineAt = null }) {
  return request("/polls", {
    method: "POST",
    body: { title, question, options, resultsVisibility, deadlineAt: deadlineAt || null },
  });
}

export function updatePoll(id, payload) {
  return request(`/polls/${encodeURIComponent(id)}`, { method: "PATCH", body: payload });
}

export function savePollResponse(id, optionId) {
  return request(`/polls/${encodeURIComponent(id)}/response`, {
    method: "PUT",
    body: { optionId },
  });
}

export function closePoll(id) {
  return request(`/polls/${encodeURIComponent(id)}/close`, { method: "POST", body: {} });
}

export function cancelPoll(id, reason = "") {
  return request(`/polls/${encodeURIComponent(id)}/cancel`, { method: "POST", body: { reason } });
}

export function getPollResults(id) { return request(`/polls/${encodeURIComponent(id)}/results`); }

export function getPublicPollResults(id) {
  return request(`/public/polls/${encodeURIComponent(id)}/results`, {
    credentials: "omit",
    authenticated: false,
  });
}

export function clearNativeSession() { nativeSessionToken = ""; }
export function hasNativeSession() { return nativePlatform && Boolean(nativeSessionToken); }

async function request(path, {
  method = "GET",
  body,
  credentials = nativePlatform ? "omit" : "include",
  authenticated = true,
} = {}) {
  const base = getApiBaseUrl();
  if (!base) {
    const error = new Error("Configurez l’adresse du serveur Verger dans Réglages.");
    error.status = 0;
    error.code = "server_not_configured";
    throw error;
  }

  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (nativePlatform && authenticated && nativeSessionToken) {
    headers.Authorization = `Bearer ${nativeSessionToken}`;
  }

  const response = await fetch(`${base}${path}`, {
    method,
    credentials,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try { data = await response.json(); }
  catch { data = {}; }

  if (!response.ok) {
    if (nativePlatform && response.status === 401) nativeSessionToken = "";
    const error = new Error(data?.message || `Erreur HTTP ${response.status}`);
    error.status = response.status;
    error.code = data?.error || "http_error";
    throw error;
  }
  return data;
}
