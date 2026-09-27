const BASE = "/api/v1";

export async function getSession() {
  try {
    return await request("/session");
  } catch (error) {
    if (error.status === 401) return { account: null };
    throw error;
  }
}

export function login({ organizationId, email, password }) {
  return request("/login", { method: "POST", body: { organizationId, email, password } });
}

export function logout() {
  return request("/logout", { method: "POST", body: {} });
}

export function acceptInvitation({ token, password }) {
  return request("/invitations/accept", { method: "POST", body: { token, password } });
}

export function createInvitation({ email, role, memberId = null }) {
  return request("/invitations", { method: "POST", body: { email, role, memberId: memberId || null } });
}

export function listPolls() {
  return request("/polls");
}

export function getPoll(id) {
  return request(`/polls/${encodeURIComponent(id)}`);
}

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

export function getPollResults(id) {
  return request(`/polls/${encodeURIComponent(id)}/results`);
}

export function getPublicPollResults(id) {
  return request(`/public/polls/${encodeURIComponent(id)}/results`, { credentials: "omit" });
}

async function request(path, { method = "GET", body, credentials = "include" } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try { data = await response.json(); }
  catch { data = {}; }

  if (!response.ok) {
    const error = new Error(data?.message || `Erreur HTTP ${response.status}`);
    error.status = response.status;
    error.code = data?.error || "http_error";
    throw error;
  }
  return data;
}
