import { randomUUID } from "node:crypto";
import { ACCOUNT_ROLES, POLL_VISIBILITIES, transaction } from "./authority-db.js";
import { hashPassword, hashSecret, randomSecret, verifyPassword } from "./authority-security.js";

export class AuthorityError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "AuthorityError";
    this.status = status;
    this.code = code;
  }
}

const nowIso = () => new Date().toISOString();

function fail(status, code, message) {
  throw new AuthorityError(status, code, message);
}

function cleanEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 254) fail(400, "invalid_email", "Adresse e-mail invalide");
  return email;
}

function requireRole(role) {
  if (!ACCOUNT_ROLES.includes(role)) fail(400, "invalid_role", "Rôle de compte invalide");
  return role;
}

function requireVisibility(value) {
  if (!POLL_VISIBILITIES.includes(value)) fail(400, "invalid_visibility", "Visibilité des résultats invalide");
  return value;
}

function audit(db, actor, action, entityType, entityId, details = null) {
  db.prepare(`INSERT INTO audit_log
    (organization_id, account_id, action, entity_type, entity_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(
      actor?.organizationId || details?.organizationId || "",
      actor?.id || null,
      action,
      entityType,
      String(entityId),
      details ? JSON.stringify(details) : null,
      nowIso(),
    );
}

export function createOrganization(db, { id = randomUUID(), name }) {
  const cleanName = String(name || "").trim();
  if (!cleanName) fail(400, "invalid_organization", "Nom d’organisation obligatoire");
  db.prepare("INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?)")
    .run(String(id), cleanName.slice(0, 180), nowIso());
  return String(id);
}

export function createAccount(db, {
  organizationId,
  email,
  password,
  role,
  memberId = null,
  id = randomUUID(),
}) {
  requireRole(role);
  const org = db.prepare("SELECT id FROM organizations WHERE id = ?").get(String(organizationId));
  if (!org) fail(404, "organization_not_found", "Organisation introuvable");
  try {
    db.prepare(`INSERT INTO accounts
      (id, organization_id, email, password_hash, role, member_id, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)`)
      .run(
        String(id),
        String(organizationId),
        cleanEmail(email),
        hashPassword(password),
        role,
        memberId ? String(memberId) : null,
        nowIso(),
      );
  } catch (error) {
    if (String(error?.message || "").includes("UNIQUE")) fail(409, "account_exists", "Un compte existe déjà pour cette adresse");
    throw error;
  }
  return getAccountById(db, id);
}

export function getAccountById(db, id) {
  const row = db.prepare(`SELECT id, organization_id, email, role, member_id, active, created_at
    FROM accounts WHERE id = ?`).get(String(id));
  return row ? mapAccount(row) : null;
}

export function authenticateAccount(db, { organizationId, email, password }) {
  const row = db.prepare(`SELECT * FROM accounts
    WHERE organization_id = ? AND email = ? AND active = 1`)
    .get(String(organizationId || ""), cleanEmail(email));
  if (!row || !verifyPassword(password, row.password_hash)) {
    fail(401, "invalid_credentials", "Identifiants invalides");
  }
  return mapAccount(row);
}

export function createSession(db, account, { ttlMs = 1000 * 60 * 60 * 24 * 30 } = {}) {
  const token = randomSecret(32);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  db.prepare(`INSERT INTO sessions (id, account_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)`)
    .run(randomUUID(), account.id, hashSecret(token), expiresAt, createdAt);
  return { token, expiresAt };
}

export function accountFromSessionToken(db, token) {
  if (!token) return null;
  const row = db.prepare(`SELECT a.id, a.organization_id, a.email, a.role, a.member_id, a.active, a.created_at
    FROM sessions s
    JOIN accounts a ON a.id = s.account_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND a.active = 1`)
    .get(hashSecret(token), nowIso());
  return row ? mapAccount(row) : null;
}

export function revokeSession(db, token) {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashSecret(token));
}

export function createInvitation(db, actor, {
  email,
  role,
  memberId = null,
  ttlMs = 1000 * 60 * 60 * 24 * 7,
}) {
  requireActor(actor);
  if (actor.role !== "administrator") fail(403, "forbidden", "Seul un administrateur peut inviter des comptes");
  requireRole(role);
  const token = randomSecret(32);
  const id = randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  db.prepare(`INSERT INTO invitations
    (id, organization_id, created_by_account_id, email, role, member_id, token_hash, expires_at, used_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`)
    .run(
      id,
      actor.organizationId,
      actor.id,
      cleanEmail(email),
      role,
      memberId ? String(memberId) : null,
      hashSecret(token),
      expiresAt,
      createdAt,
    );
  audit(db, actor, "invitation.created", "invitation", id, { role, memberId: memberId || null });
  return { id, token, expiresAt, role };
}

export function acceptInvitation(db, { token, password }) {
  return transaction(db, () => {
    const invitation = db.prepare(`SELECT * FROM invitations
      WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`)
      .get(hashSecret(token), nowIso());
    if (!invitation) fail(404, "invitation_invalid", "Invitation invalide ou expirée");
    const account = createAccount(db, {
      organizationId: invitation.organization_id,
      email: invitation.email,
      password,
      role: invitation.role,
      memberId: invitation.member_id,
    });
    db.prepare("UPDATE invitations SET used_at = ? WHERE id = ?").run(nowIso(), invitation.id);
    audit(db, account, "invitation.accepted", "invitation", invitation.id, { organizationId: account.organizationId });
    return account;
  });
}

export function createPoll(db, actor, {
  title,
  question,
  options,
  resultsVisibility = "members",
  deadlineAt = null,
}) {
  requireActor(actor);
  if (!["administrator", "facilitator"].includes(actor.role)) {
    fail(403, "forbidden", "Ce compte ne peut pas créer de consultation");
  }
  const cleanTitle = String(title || "").trim();
  const cleanQuestion = String(question || "").trim();
  if (!cleanTitle) fail(400, "invalid_title", "Titre obligatoire");
  if (!cleanQuestion) fail(400, "invalid_question", "Question obligatoire");
  const normalizedOptions = normalizeOptions(options);
  requireVisibility(resultsVisibility);

  return transaction(db, () => {
    const id = randomUUID();
    const createdAt = nowIso();
    db.prepare(`INSERT INTO polls
      (id, organization_id, created_by_account_id, title, question, status, results_visibility, deadline_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)`)
      .run(
        id,
        actor.organizationId,
        actor.id,
        cleanTitle.slice(0, 240),
        cleanQuestion.slice(0, 2000),
        resultsVisibility,
        deadlineAt ? String(deadlineAt).slice(0, 40) : null,
        createdAt,
      );
    insertOptions(db, id, normalizedOptions);
    audit(db, actor, "poll.created", "poll", id, { resultsVisibility, optionCount: normalizedOptions.length });
    return getPoll(db, actor, id);
  });
}

export function updatePollBeforeResponses(db, actor, pollId, {
  title,
  question,
  options,
  resultsVisibility,
  deadlineAt = null,
}) {
  requireActor(actor);
  return transaction(db, () => {
    const poll = getPollRow(db, pollId);
    requireSameOrganization(actor, poll);
    if (poll.created_by_account_id !== actor.id) fail(403, "creator_required", "Seul le créateur peut modifier cette consultation");
    if (poll.status !== "open") fail(409, "poll_not_open", "La consultation n’est plus ouverte");
    const responseCount = Number(db.prepare("SELECT COUNT(*) AS count FROM poll_responses WHERE poll_id = ?").get(poll.id).count);
    if (responseCount > 0 || poll.first_response_at) {
      fail(409, "poll_locked", "Les choix et la visibilité sont figés après la première réponse");
    }

    const cleanTitle = String(title || "").trim();
    const cleanQuestion = String(question || "").trim();
    if (!cleanTitle || !cleanQuestion) fail(400, "invalid_poll", "Titre et question obligatoires");
    const normalizedOptions = normalizeOptions(options);
    requireVisibility(resultsVisibility);

    db.prepare(`UPDATE polls SET title = ?, question = ?, results_visibility = ?, deadline_at = ?
      WHERE id = ?`)
      .run(
        cleanTitle.slice(0, 240),
        cleanQuestion.slice(0, 2000),
        resultsVisibility,
        deadlineAt ? String(deadlineAt).slice(0, 40) : null,
        poll.id,
      );
    db.prepare("DELETE FROM poll_options WHERE poll_id = ?").run(poll.id);
    insertOptions(db, poll.id, normalizedOptions);
    audit(db, actor, "poll.updated_before_response", "poll", poll.id, { optionCount: normalizedOptions.length });
    return getPoll(db, actor, poll.id);
  });
}

export function listPolls(db, actor) {
  requireActor(actor);
  const rows = db.prepare(`SELECT p.*,
      (SELECT COUNT(*) FROM poll_responses r WHERE r.poll_id = p.id) AS response_count
    FROM polls p
    WHERE p.organization_id = ?
    ORDER BY CASE p.status WHEN 'open' THEN 0 WHEN 'closed' THEN 1 ELSE 2 END,
      p.created_at DESC`)
    .all(actor.organizationId);
  return rows.map((row) => ({
    ...mapPollRow(row),
    responseCount: Number(row.response_count || 0),
  }));
}

export function getPoll(db, actor, pollId) {
  requireActor(actor);
  const poll = getPollRow(db, pollId);
  requireSameOrganization(actor, poll);
  const options = db.prepare("SELECT id, label, position FROM poll_options WHERE poll_id = ? ORDER BY position").all(poll.id);
  const response = db.prepare(`SELECT option_id FROM poll_responses WHERE poll_id = ? AND account_id = ?`)
    .get(poll.id, actor.id);
  return {
    ...mapPollRow(poll),
    options,
    responseCount: Number(db.prepare("SELECT COUNT(*) AS count FROM poll_responses WHERE poll_id = ?").get(poll.id).count),
    myOptionId: response?.option_id || null,
    canClose: poll.status === "open" && poll.created_by_account_id === actor.id,
    canRespond: poll.status === "open" && ["administrator", "facilitator", "member"].includes(actor.role),
    canEdit: poll.status === "open" && poll.created_by_account_id === actor.id && !poll.first_response_at,
  };
}

export function saveResponse(db, actor, pollId, optionId) {
  requireActor(actor);
  if (!["administrator", "facilitator", "member"].includes(actor.role)) {
    fail(403, "forbidden", "Ce compte ne peut pas répondre");
  }
  return transaction(db, () => {
    const poll = getPollRow(db, pollId);
    requireSameOrganization(actor, poll);
    if (poll.status !== "open") fail(409, "poll_closed", "Cette consultation n’accepte plus de réponse");
    const option = db.prepare("SELECT id FROM poll_options WHERE id = ? AND poll_id = ?").get(String(optionId), poll.id);
    if (!option) fail(400, "invalid_option", "Choix invalide");
    const timestamp = nowIso();
    db.prepare(`INSERT INTO poll_responses (poll_id, account_id, option_id, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(poll_id, account_id)
      DO UPDATE SET option_id = excluded.option_id, updated_at = excluded.updated_at`)
      .run(poll.id, actor.id, option.id, timestamp);
    if (!poll.first_response_at) {
      db.prepare("UPDATE polls SET first_response_at = ? WHERE id = ? AND first_response_at IS NULL")
        .run(timestamp, poll.id);
    }
    audit(db, actor, "poll.response_saved", "poll", poll.id, null);
    return { ok: true, optionId: option.id, updatedAt: timestamp };
  });
}

export function closePoll(db, actor, pollId) {
  requireActor(actor);
  return transaction(db, () => {
    const poll = getPollRow(db, pollId);
    requireSameOrganization(actor, poll);
    if (poll.created_by_account_id !== actor.id) {
      fail(403, "creator_required", "Seul le compte créateur peut clôturer cette consultation");
    }
    if (poll.status !== "open") fail(409, "poll_not_open", "La consultation n’est plus ouverte");
    const closedAt = nowIso();
    db.prepare("UPDATE polls SET status = 'closed', closed_at = ? WHERE id = ?").run(closedAt, poll.id);
    audit(db, actor, "poll.closed", "poll", poll.id, null);
    return aggregatedResults(db, poll.id, { requireClosed: true });
  });
}

export function cancelPoll(db, actor, pollId, reason = "") {
  requireActor(actor);
  if (actor.role !== "administrator") fail(403, "forbidden", "Seul un administrateur peut annuler une consultation");
  return transaction(db, () => {
    const poll = getPollRow(db, pollId);
    requireSameOrganization(actor, poll);
    if (poll.status === "cancelled") fail(409, "poll_cancelled", "La consultation est déjà annulée");
    const cancelledAt = nowIso();
    db.prepare("UPDATE polls SET status = 'cancelled', cancelled_at = ? WHERE id = ?").run(cancelledAt, poll.id);
    audit(db, actor, "poll.cancelled", "poll", poll.id, { reason: String(reason || "").slice(0, 500) });
    return { ok: true, status: "cancelled", cancelledAt };
  });
}

export function memberResults(db, actor, pollId) {
  requireActor(actor);
  const poll = getPollRow(db, pollId);
  requireSameOrganization(actor, poll);
  return aggregatedResults(db, poll.id, { requireClosed: true });
}

export function publicResults(db, pollId) {
  const poll = getPollRow(db, pollId);
  if (poll.status !== "closed" || poll.results_visibility !== "public_after_close") {
    fail(404, "public_results_unavailable", "Résultats publics indisponibles");
  }
  return aggregatedResults(db, poll.id, { requireClosed: true, publicView: true });
}

function aggregatedResults(db, pollId, { requireClosed = false, publicView = false } = {}) {
  const poll = getPollRow(db, pollId);
  if (requireClosed && poll.status !== "closed") fail(409, "poll_not_closed", "Les résultats ne sont disponibles qu’après clôture");
  const rows = db.prepare(`SELECT o.id, o.label, o.position, COUNT(r.account_id) AS count
    FROM poll_options o
    LEFT JOIN poll_responses r ON r.option_id = o.id AND r.poll_id = o.poll_id
    WHERE o.poll_id = ?
    GROUP BY o.id, o.label, o.position
    ORDER BY o.position`)
    .all(poll.id);
  const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  return {
    id: poll.id,
    title: poll.title,
    question: poll.question,
    status: poll.status,
    closedAt: poll.closed_at || null,
    total,
    resultsVisibility: publicView ? "public_after_close" : poll.results_visibility,
    options: rows.map((row) => {
      const count = Number(row.count || 0);
      return {
        id: row.id,
        label: row.label,
        count,
        percent: total ? Number(((count * 100) / total).toFixed(2)) : 0,
      };
    }),
  };
}

function getPollRow(db, pollId) {
  const poll = db.prepare("SELECT * FROM polls WHERE id = ?").get(String(pollId));
  if (!poll) fail(404, "poll_not_found", "Consultation introuvable");
  return poll;
}

function requireActor(actor) {
  if (!actor?.id || !actor?.organizationId || !actor?.role) fail(401, "authentication_required", "Authentification requise");
}

function requireSameOrganization(actor, row) {
  if (String(row.organization_id) !== String(actor.organizationId)) {
    fail(404, "poll_not_found", "Consultation introuvable");
  }
}

function normalizeOptions(options) {
  if (!Array.isArray(options) || options.length < 2 || options.length > 8) {
    fail(400, "invalid_options", "Une consultation doit proposer entre 2 et 8 réponses");
  }
  const labels = options.map((value) => String(value || "").trim());
  if (labels.some((label) => !label || label.length > 240)) fail(400, "invalid_options", "Réponse proposée invalide");
  if (new Set(labels.map((label) => label.toLocaleLowerCase("fr"))).size !== labels.length) {
    fail(400, "duplicate_options", "Les réponses proposées doivent être distinctes");
  }
  return labels;
}

function insertOptions(db, pollId, options) {
  const insert = db.prepare("INSERT INTO poll_options (id, poll_id, label, position) VALUES (?, ?, ?, ?)");
  options.forEach((label, index) => insert.run(randomUUID(), pollId, label, index));
}

function mapAccount(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    role: row.role,
    memberId: row.member_id || null,
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

function mapPollRow(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdBy: row.created_by_account_id,
    title: row.title,
    question: row.question,
    status: row.status,
    resultsVisibility: row.results_visibility,
    deadlineAt: row.deadline_at || null,
    firstResponseAt: row.first_response_at || null,
    createdAt: row.created_at,
    closedAt: row.closed_at || null,
    cancelledAt: row.cancelled_at || null,
  };
}
