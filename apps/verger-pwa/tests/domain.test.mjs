import assert from "node:assert/strict";
import {
  addAction,
  addAgendaItem,
  addContribution,
  addEvent,
  addMeeting,
  addMember,
  addProposal,
  addVolunteerNeed,
  counts,
  createInitialState,
  exportPortableJson,
  importPortableJson,
  recordDecision,
} from "../src/domain.js";

const doc = createInitialState("Aldebaran test");
const member = addMember(doc, { name: "Alice", role: "Trésorière" });
assert.equal(doc.members[member].name, "Alice");

const meeting = addMeeting(doc, { title: "CA septembre", date: "2026-09-27" });
addAgendaItem(doc, meeting, "Budget");
const proposal = addProposal(doc, meeting, { title: "Ouvrir une permanence", details: "Une fois par mois" });
addContribution(doc, meeting, proposal, { type: "objection", text: "Prévoir une rotation", author: "Bob" });
recordDecision(doc, meeting, proposal, { status: "accepted", method: "consent", text: "Permanence le premier samedi" });
addAction(doc, { text: "Créer le planning", owner: "Alice", meetingId: meeting, proposalId: proposal });
addEvent(doc, { title: "Permanence", date: "2026-10-03", location: "Local" });
addVolunteerNeed(doc, { title: "Tenir l’accueil", slots: 2 });

assert.deepEqual(counts(doc), {
  members: 1,
  meetings: 1,
  openActions: 1,
  events: 1,
  volunteerNeeds: 1,
  decisions: 1,
});

const exported = exportPortableJson(doc);
const imported = importPortableJson(exported);
assert.equal(imported.organization.name, "Aldebaran test");
assert.equal(Object.keys(imported.meetings).length, 1);
assert.throws(() => importPortableJson('{"hello":"world"}'));

console.log("Tests domaine Verger v0.3 : OK");
