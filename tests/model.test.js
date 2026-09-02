"use strict";

const assert = require("node:assert/strict");
const Model = require("../apps/reunions-decisions/model.js");

function operation(collection, id, fields, counter, actor = "alice@example.test", version = 2) {
  return { version, type: "patch", collection, id, fields, stamp: { counter, actor } };
}

function testReplayIsIdempotent() {
  const state = Model.createState();
  const patch = operation("agenda", "point-1", { text: "Budget", done: false, createdAt: "2026-09-02T10:00:00Z" }, 1);
  assert.equal(Model.applyPatch(state, patch), true);
  assert.equal(Model.applyPatch(state, patch), false);
  assert.equal(Model.records(state, "agenda").length, 1);
}

function testConcurrentUpdatesConverge() {
  const left = Model.createState();
  const right = Model.createState();
  const alice = operation("proposals", "proposal-1", { title: "Version Alice" }, 4, "alice@example.test");
  const bob = operation("proposals", "proposal-1", { title: "Version Bob" }, 4, "bob@example.test");
  [alice, bob].forEach((patch) => Model.applyPatch(left, patch));
  [bob, alice].forEach((patch) => Model.applyPatch(right, patch));
  assert.equal(left.proposals["proposal-1"].title, right.proposals["proposal-1"].title);
  assert.equal(left.proposals["proposal-1"].title, "Version Bob");
}

function testStaleFieldsCannotOverwriteNewerOnes() {
  const state = Model.createState();
  Model.applyPatch(state, operation("actions", "action-1", { text: "Envoyer le relevé", done: true }, 9));
  Model.applyPatch(state, operation("actions", "action-1", { text: "Ancien texte", done: false }, 2));
  assert.equal(state.actions["action-1"].text, "Envoyer le relevé");
  assert.equal(state.actions["action-1"].done, true);
}

function testInvalidInputIsIgnored() {
  const state = Model.createState();
  assert.equal(Model.applyPatch(state, operation("agenda", "__proto__", { text: "Non" }, 1)), false);
  Model.applyPatch(state, operation("agenda", "safe", { text: "Oui", unexpected: "ignoré" }, 2));
  assert.equal(state.agenda.safe.text, "Oui");
  assert.equal(Object.hasOwn(state.agenda.safe, "unexpected"), false);
  assert.equal({}.unexpected, undefined);
}

function testLegacyPrototypeDataStillLoads() {
  const state = Model.createState();
  const legacy = operation("proposals", "old", { title: "Ancienne proposition", status: "discussion" }, 1, "alice@example.test", 1);
  assert.equal(Model.applyPatch(state, legacy), true);
  assert.equal(state.proposals.old.status, "discussion");
}

function testExportsContainTheDecisionCycle() {
  const state = Model.createState();
  Model.applyPatch(state, operation("meeting", "main", { title: "CA de septembre", date: "2026-09-15", archiveReference: "Dossier partagé / PV 09" }, 1));
  Model.applyPatch(state, operation("proposals", "p1", {
    title: "Ouvrir une permanence",
    details: "Une fois par mois",
    status: "accepted",
    decisionText: "Permanence le premier samedi",
    reviewDate: "2026-12-01",
    archived: false,
    createdAt: "2026-09-02T10:00:00Z",
  }, 2));
  Model.applyPatch(state, operation("contributions", "c1", {
    proposalId: "p1",
    type: "objection",
    text: "Prévoir une rotation",
    author: "Bob",
    resolved: true,
    archived: false,
    createdAt: "2026-09-02T10:01:00Z",
  }, 3));
  Model.applyPatch(state, operation("actions", "a1", {
    proposalId: "p1",
    text: "Créer le planning",
    owner: "Alice",
    due: "2026-09-20",
    done: false,
    archived: false,
    createdAt: "2026-09-02T10:02:00Z",
  }, 4));

  const markdown = Model.markdownExport(state);
  assert.match(markdown, /Décision retenue : Permanence le premier samedi/);
  assert.match(markdown, /Objection.*Bob.*traitée/);
  assert.match(markdown, /Créer le planning/);
  assert.match(markdown, /Archive officielle : Dossier partagé \/ PV 09/);

  const json = JSON.parse(Model.jsonExport(state, "2026-09-02T12:00:00Z"));
  assert.equal(json.schemaVersion, 2);
  assert.equal(json.contributions.length, 1);
  assert.equal(json.actions[0].proposalId, "p1");
  assert.equal(Object.hasOwn(json.proposals[0], "_meta"), false);
}

[
  testReplayIsIdempotent,
  testConcurrentUpdatesConverge,
  testStaleFieldsCannotOverwriteNewerOnes,
  testInvalidInputIsIgnored,
  testLegacyPrototypeDataStillLoads,
  testExportsContainTheDecisionCycle,
].forEach((test) => test());

console.log("6 tests du modèle réussis.");
