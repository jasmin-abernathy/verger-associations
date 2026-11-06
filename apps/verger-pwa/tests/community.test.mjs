import assert from "node:assert/strict";
import { addEvent, addMember, addVolunteerNeed, createInitialState, ensureState, exportPortableJson, importPortableJson, setArchived } from "../src/domain.js";
import {
  addIdea, updateIdea, addResource, updateResource, validateResourceUrl,
  setEventParticipant, setVolunteerParticipant, setVolunteerClosed, exportEventIcs,
  renderIdeas, renderResources, renderAttendance, renderVolunteers,
} from "../src/community.js";

const doc = createInitialState("Association pilote");
const alice = addMember(doc, { name: "Alice" });
const bob = addMember(doc, { name: "Bob" });
const ideaId = addIdea(doc, { title: "Un jardin collectif", details: "<script>pas exécuté</script>" });
updateIdea(doc, ideaId, { title: "Jardin collectif", status: "discussion" });
assert.equal(doc.ideas[ideaId].status, "discussion");
assert.throws(() => updateIdea(doc, ideaId, { title: "Test", status: "unknown" }));
assert.match(renderIdeas(doc), /Jardin collectif/);
assert.doesNotMatch(renderIdeas(doc), /<script>/);
const resource = addResource(doc, { title: "Fiche accueil", url: "https://example.org/accueil" });
updateResource(doc, resource, { title: "Fiche d'accueil", description: "Un lien utile", url: "https://example.org/" });
assert.match(renderResources(doc), /Fiche d&#039;accueil/);
doc.resources[resource].url = "javascript:alert(1)";
assert.doesNotMatch(renderResources(doc), /href="javascript:/);
doc.resources[resource].url = "https://example.org/";
for (const url of ["javascript:alert(1)", "file:///tmp/file", "https://user:password@example.org"]) {
  assert.throws(() => validateResourceUrl(url));
}
const event = addEvent(doc, { title: "Assemblée générale", date: "2026-11-06", location: "Salle commune" });
setEventParticipant(doc, event, alice, true);
setEventParticipant(doc, event, alice, true);
assert.equal(Object.keys(doc.events[event].participants).length, 1);
assert.match(renderAttendance(doc, doc.events[event]), /Participants \(1\)/);
setEventParticipant(doc, event, alice, false);
assert.equal(Object.keys(doc.events[event].participants).length, 0);
assert.match(exportEventIcs(doc.events[event]), /DTSTART;VALUE=DATE:20261106/);
assert.match(exportEventIcs(doc.events[event]), /DTEND;VALUE=DATE:20261107/);
const need = addVolunteerNeed(doc, { title: "Tenir l'accueil", slots: 1 });
setVolunteerParticipant(doc, need, alice, true);
assert.match(renderVolunteers(doc, doc.volunteerNeeds[need]), /1 \/ 1/);
assert.throws(() => setVolunteerParticipant(doc, need, bob, true), /places/);
setVolunteerParticipant(doc, need, alice, false);
setVolunteerClosed(doc, need, true);
assert.throws(() => setVolunteerParticipant(doc, need, alice, true), /clôturé/);
setArchived(doc, "ideas", ideaId, true);
setArchived(doc, "resources", resource, true);
const restored = importPortableJson(exportPortableJson(doc));
assert.equal(restored.ideas[ideaId].archived, true);
assert.equal(restored.resources[resource].archived, true);
const legacy = createInitialState();
delete legacy.ideas; delete legacy.resources;
ensureState(legacy);
assert.deepEqual(legacy.ideas, {});
assert.deepEqual(legacy.resources, {});
console.log("Tests communauté Verger : OK");
