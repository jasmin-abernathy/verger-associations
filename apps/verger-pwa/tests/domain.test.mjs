import assert from "node:assert/strict";
import {
  addAction,
  addAgendaItem,
  addContribution,
  addEvent,
  addHelpPost,
  addMeeting,
  addMember,
  addProposal,
  addVolunteerNeed,
  counts,
  createInitialState,
  exportPortableJson,
  importPortableJson,
  recordDecision,
  setHelpPostClosed,
  setWelcomeStep,
  updateMember,
  updateAction,
  updateEvent,
  updateHelpPost,
  setArchived,
  addConsultation,
  addConsultationResponse,
  setConsultationClosed,
  ensureState,
} from "../src/domain.js";
import { exportMeetingMarkdown, importAnyJson } from "../src/portability.js";

const doc = createInitialState("Aldebaran test");
const member = addMember(doc, { name: "Alice", role: "Trésorière" });
assert.equal(doc.members[member].name, "Alice");
setWelcomeStep(doc, member, "introduced", true);
assert.equal(doc.members[member].welcome.introduced, true);
const help = addHelpPost(doc, { kind: "request", title: "Transport pour la réunion", contact: "Alice" });
setHelpPostClosed(doc, help, true);
assert.equal(doc.helpPosts[help].closed, true);
assert.throws(() => addHelpPost(doc, { kind: "invalid", title: "Test" }));

updateMember(doc, member, { name: "Alice Dupont", role: "Trésorière", contact: "alice@example.test" });
assert.equal(doc.members[member].id, member);
assert.equal(doc.members[member].name, "Alice Dupont");

updateHelpPost(doc, help, { kind: "offer", title: "Covoiturage", details: "Deux places", contact: "Alice" });
assert.equal(doc.helpPosts[help].id, help);
assert.equal(doc.helpPosts[help].kind, "offer");
setArchived(doc, "helpPosts", help, true);
assert.equal(doc.helpPosts[help].archived, true);
setArchived(doc, "helpPosts", help, false);
assert.equal(doc.helpPosts[help].archived, false);

const consultation = addConsultation(doc, { title: "Horaires", question: "Quel créneau préférez-vous ?" });
const response = addConsultationResponse(doc, consultation, { author: "Alice Dupont", answer: "Le mardi soir" });
assert.equal(doc.consultations[consultation].responses[response].author, "Alice Dupont");
setConsultationClosed(doc, consultation, true);
assert.equal(doc.consultations[consultation].closed, true);
assert.throws(() => addConsultationResponse(doc, consultation, { author: "Bob", answer: "Mercredi" }));
setConsultationClosed(doc, consultation, false);

const meeting = addMeeting(doc, { title: "CA septembre", date: "2026-09-27" });
addAgendaItem(doc, meeting, "Budget");
const proposal = addProposal(doc, meeting, { title: "Ouvrir une permanence", details: "Une fois par mois" });
addContribution(doc, meeting, proposal, { type: "objection", text: "Prévoir une rotation", author: "Bob" });
recordDecision(doc, meeting, proposal, { status: "accepted", method: "consent", text: "Permanence le premier samedi" });
const action = addAction(doc, { text: "Créer le planning", owner: "Alice", meetingId: meeting, proposalId: proposal });
updateAction(doc, action, { text: "Finaliser le planning", owner: "Alice Dupont", due: "2026-10-01" });
assert.equal(doc.actions[action].id, action);
assert.equal(doc.actions[action].text, "Finaliser le planning");
const event = addEvent(doc, { title: "Permanence", date: "2026-10-03", location: "Local" });
updateEvent(doc, event, { title: "Permanence mensuelle", date: "2026-10-04", location: "Maison des associations" });
assert.equal(doc.events[event].id, event);
assert.equal(doc.events[event].title, "Permanence mensuelle");
addVolunteerNeed(doc, { title: "Tenir l’accueil", slots: 2 });

assert.deepEqual(counts(doc), {
  members: 1,
  meetings: 1,
  openActions: 1,
  events: 1,
  volunteerNeeds: 1,
  decisions: 1,
});

const markdown = exportMeetingMarkdown(doc, meeting);
assert.match(markdown, /# CA septembre/);
assert.match(markdown, /Décision retenue : Permanence le premier samedi/);
assert.match(markdown, /Finaliser le planning/);

const exported = exportPortableJson(doc);
const imported = importPortableJson(exported);
assert.equal(imported.organization.name, "Aldebaran test");
assert.equal(Object.keys(imported.meetings).length, 1);
assert.equal(Object.keys(imported.helpPosts).length, 1);
assert.equal(Object.keys(imported.consultations).length, 1);
assert.equal(imported.schemaVersion, 2);
assert.throws(() => importPortableJson('{"hello":"world"}'));

const legacy = importAnyJson(JSON.stringify({
  schemaVersion: 2,
  exportedAt: "2026-09-02T12:00:00Z",
  meeting: { title: "Ancien CA", date: "2026-09-02", facilitator: "Alice", secretary: "Bob", archiveReference: "PV-09" },
  agenda: [{ id: "agenda-1", text: "Budget", done: true, archived: false, createdAt: "2026-09-02T10:00:00Z" }],
  proposals: [{ id: "proposal-1", title: "Permanence", details: "Mensuelle", status: "accepted", decisionText: "Premier samedi", reviewDate: "2026-12-01", archived: false, createdAt: "2026-09-02T10:01:00Z" }],
  contributions: [{ id: "contribution-1", proposalId: "proposal-1", type: "objection", text: "Rotation", author: "Bob", resolved: true, archived: false }],
  actions: [{ id: "action-1", proposalId: "proposal-1", text: "Planning", owner: "Alice", due: "2026-09-20", done: false, archived: false }],
}));
const legacyMeeting = Object.values(legacy.meetings)[0];
assert.equal(legacyMeeting.title, "Ancien CA");
assert.equal(Object.keys(legacyMeeting.proposals).length, 1);
assert.equal(Object.keys(Object.values(legacyMeeting.proposals)[0].contributions).length, 1);
assert.equal(Object.values(legacy.actions)[0].meetingId, legacyMeeting.id);
assert.deepEqual(ensureState(legacy).helpPosts, {});

console.log("Tests domaine Verger : OK");
