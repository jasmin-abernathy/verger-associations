import { randomUUID } from "node:crypto";
import { normalizeDomain } from "./organization-registration.js";
import { AuthorityError, createInvitation } from "./consultations-service.js";
import { transaction } from "./authority-db.js";

const fail = (status, code, message) => { throw new AuthorityError(status, code, message); };
const validRoles = new Set(["facilitator", "member"]);
function administrator(actor) {
  if (!actor || actor.role !== "administrator") fail(403, "forbidden", "Accès réservé à la présidence habilitée");
}
export function publicOrganization(db, rawDomain) {
  const domain = normalizeDomain(rawDomain);
  const row = db.prepare("SELECT id, name, domain FROM organizations WHERE domain = ? AND domain_verified_at IS NOT NULL").get(domain);
  if (!row) fail(404, "organization_not_found", "Association introuvable ou non vérifiée");
  return row;
}
export function requestAccess(db, { domain, email, role, message = "" }) {
  const requestedRole = String(role || "");
  if (!validRoles.has(requestedRole)) fail(400, "invalid_role", "Sélectionnez Bénévoles ou Bureau / fondateurs");
  const cleanedEmail = String(email || "").trim().toLowerCase();
  if (cleanedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
    fail(400, "invalid_email", "Adresse e-mail invalide");
  }
  const cleanMessage = String(message || "").trim();
  if (cleanMessage.length > 1000) fail(400, "invalid_message", "Message trop long (1 000 caractères maximum)");
  let org;
  try { org = publicOrganization(db, domain); }
  catch (err) { if (err?.code === "organization_not_found") return { accepted: true }; throw err; }
  // Avoid multiplying requests from an unchecked email address.
  const existing = db.prepare("SELECT id FROM access_requests WHERE organization_id = ? AND email = ? AND status = 'pending'").get(org.id, cleanedEmail);
  if (!existing) {
    db.prepare("INSERT INTO access_requests (id, organization_id, email, role, message, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(randomUUID(), org.id, cleanedEmail, requestedRole, cleanMessage, new Date().toISOString());
  }
  // Identical response whether org exists, request is duplicate, or just recorded.
  return { accepted: true };
}
export function listAccessRequests(db, actor) {
  administrator(actor);
  return db.prepare("SELECT id, email, role, message, created_at FROM access_requests WHERE organization_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 100")
    .all(actor.organizationId).map(x=>({id:x.id,email:x.email,role:x.role,message:x.message,createdAt:x.created_at}));
}
export function decideAccessRequest(db, actor, requestId, approved) {
  administrator(actor);
  return transaction(db, () => {
    const row = db.prepare("SELECT * FROM access_requests WHERE id = ? AND organization_id = ? AND status = 'pending'").get(String(requestId), actor.organizationId);
    if (!row) fail(404, "request_not_found", "Demande introuvable");
    const role = row.role;
    if (!validRoles.has(role)) fail(400, "invalid_role", "Rôle non autorisé");
    const result = approved ? createInvitation(db, actor, {email:row.email,role}) : null;
    db.prepare("UPDATE access_requests SET status = ?, resolved_at = ? WHERE id = ?").run(approved?"approved":"rejected",new Date().toISOString(),row.id);
    return approved?{ invitation:result, email:row.email, role }:{rejected:true};
  });
}
