import assert from "node:assert/strict";
import { openAuthorityDatabase } from "./authority-db.js";
import { sessionTokenFromRequest } from "./authority-api.js";
import {
  acceptInvitation,
  accountFromSessionToken,
  authenticateAccount,
  cancelPoll,
  closePoll,
  createAccount,
  createInvitation,
  createSession,
  createOrganization,
  createPoll,
  getPoll,
  listPolls,
  memberResults,
  publicResults,
  revokeSession,
  saveResponse,
  updatePollBeforeResponses,
} from "./consultations-service.js";

const db = openAuthorityDatabase(":memory:");
createOrganization(db, { id: "org-a", name: "Association A" });
createOrganization(db, { id: "org-b", name: "Association B" });

const admin = createAccount(db, {
  organizationId: "org-a",
  email: "admin@example.test",
  password: "admin-password-123",
  role: "administrator",
});
const facilitator = createAccount(db, {
  organizationId: "org-a",
  email: "animateur@example.test",
  password: "animateur-password-123",
  role: "facilitator",
});
const member = createAccount(db, {
  organizationId: "org-a",
  email: "membre@example.test",
  password: "membre-password-123",
  role: "member",
});
const reader = createAccount(db, {
  organizationId: "org-a",
  email: "lecteur@example.test",
  password: "lecteur-password-123",
  role: "reader",
});
const otherOrgAdmin = createAccount(db, {
  organizationId: "org-b",
  email: "other@example.test",
  password: "other-password-123",
  role: "administrator",
});

const authenticated = authenticateAccount(db, {
  organizationId: "org-a",
  email: "admin@example.test",
  password: "admin-password-123",
});
assert.equal(authenticated.id, admin.id);
assert.throws(() => authenticateAccount(db, {
  organizationId: "org-a",
  email: "admin@example.test",
  password: "wrong-password-123",
}), (error) => error.status === 401);
const session = createSession(db, admin, { ttlMs: 60_000 });
assert.deepEqual(
  sessionTokenFromRequest({ headers: { authorization: `Bearer ${session.token}` } }),
  { token: session.token, kind: "bearer" },
);
assert.deepEqual(
  sessionTokenFromRequest({ headers: { cookie: `verger_session=${encodeURIComponent(session.token)}` } }),
  { token: session.token, kind: "cookie" },
);
assert.equal(accountFromSessionToken(db, session.token).id, admin.id);
revokeSession(db, session.token);
assert.equal(accountFromSessionToken(db, session.token), null);

assert.throws(
  () => createPoll(db, member, { title: "Interdit", question: "?", options: ["A", "B"] }),
  (error) => error.status === 403,
);

const poll = createPoll(db, facilitator, {
  title: "Horaires",
  question: "Quel créneau préférez-vous ?",
  options: ["Mardi", "Mercredi", "Jeudi"],
  resultsVisibility: "public_after_close",
});

assert.equal(poll.createdBy, facilitator.id);
assert.equal(poll.options.length, 3);
assert.equal(poll.canClose, true);
assert.equal(getPoll(db, admin, poll.id).canClose, false);
assert.throws(() => getPoll(db, otherOrgAdmin, poll.id), (error) => error.status === 404);

const mardi = poll.options[0].id;
const mercredi = poll.options[1].id;

assert.throws(() => saveResponse(db, reader, poll.id, mardi), (error) => error.status === 403);
assert.throws(() => saveResponse(db, member, poll.id, "option-invalide"), (error) => error.code === "invalid_option");

saveResponse(db, member, poll.id, mardi);
saveResponse(db, member, poll.id, mercredi);

const afterResponse = getPoll(db, member, poll.id);
assert.equal(afterResponse.responseCount, 1);
assert.equal(afterResponse.myOptionId, mercredi);

assert.throws(
  () => updatePollBeforeResponses(db, facilitator, poll.id, {
    title: "Horaires modifiés",
    question: "Nouvelle question",
    options: ["A", "B"],
    resultsVisibility: "members",
  }),
  (error) => error.code === "poll_locked",
);

assert.throws(() => closePoll(db, admin, poll.id), (error) => error.code === "creator_required");
const closed = closePoll(db, facilitator, poll.id);
assert.equal(closed.total, 1);
assert.equal(closed.options.find((option) => option.id === mercredi).count, 1);
assert.equal(closed.options.find((option) => option.id === mercredi).percent, 100);

assert.throws(() => saveResponse(db, member, poll.id, mardi), (error) => error.code === "poll_closed");

const membersAggregate = memberResults(db, admin, poll.id);
assert.equal(membersAggregate.total, 1);
assert.equal(JSON.stringify(membersAggregate).includes("membre@example.test"), false);
assert.equal(JSON.stringify(membersAggregate).includes(member.id), false);

const publicAggregate = publicResults(db, poll.id);
assert.equal(publicAggregate.total, 1);
assert.equal(publicAggregate.resultsVisibility, "public_after_close");
assert.equal(Object.hasOwn(publicAggregate, "responses"), false);

const memberOnlyPoll = createPoll(db, admin, {
  title: "Interne",
  question: "Choix interne",
  options: ["Oui", "Non"],
  resultsVisibility: "members",
});
closePoll(db, admin, memberOnlyPoll.id);
assert.throws(() => publicResults(db, memberOnlyPoll.id), (error) => error.status === 404);

assert.throws(
  () => createInvitation(db, facilitator, { email: "invite@example.test", role: "member" }),
  (error) => error.status === 403,
);
const invitation = createInvitation(db, admin, {
  email: "invite@example.test",
  role: "member",
  memberId: "member-crdt-123",
});
const invited = acceptInvitation(db, { token: invitation.token, password: "invite-password-123" });
assert.equal(invited.role, "member");
assert.equal(invited.memberId, "member-crdt-123");
assert.throws(() => acceptInvitation(db, { token: invitation.token, password: "another-password-123" }));

const toCancel = createPoll(db, facilitator, {
  title: "À annuler",
  question: "Question",
  options: ["A", "B"],
});
const cancelled = cancelPoll(db, admin, toCancel.id, "Compte créateur perdu");
assert.equal(cancelled.status, "cancelled");

createPoll(db, admin, { title: "Encore ouverte", question: "Question", options: ["A", "B"] });
const ordered = listPolls(db, admin);
assert.equal(ordered[0].status, "open");

const auditActions = db.prepare("SELECT action FROM audit_log ORDER BY id").all().map((row) => row.action);
assert.ok(auditActions.includes("poll.created"));
assert.ok(auditActions.includes("poll.response_saved"));
assert.ok(auditActions.includes("poll.closed"));
assert.ok(auditActions.includes("poll.cancelled"));
assert.ok(auditActions.includes("invitation.created"));

console.log("Tests autorité comptes/consultations : OK");
db.close();
