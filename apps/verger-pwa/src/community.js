// Fonctions collectives autonomes : aucun compte ou serveur externe n'est requis.
import { newId, touch } from "./domain.js";
import { escapeHtml as e, empty, heading } from "./helpers.js";

const IDEA_STATUS = { new: "Nouvelle", discussion: "À discuter", selected: "Retenue", dismissed: "Écartée" };
const clean = (value, limit) => String(value || "").trim().slice(0, limit);
function requiredTitle(value) {
  const result = clean(value, 240);
  if (!result) throw new Error("Un titre est nécessaire");
  return result;
}

export function addIdea(doc, { title, details = "", author = "" }) {
  const name = requiredTitle(title);
  const id = newId("idea");
  doc.ideas ||= {};
  doc.ideas[id] = {
    id, title: name, details: clean(details, 3000), author: clean(author, 120),
    status: "new", archived: false, createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}
export function updateIdea(doc, id, { title, details = "", author = "", status = "new" }) {
  const idea = doc.ideas?.[id];
  if (!idea || idea.archived) throw new Error("Idée introuvable");
  const name = requiredTitle(title);
  if (!Object.hasOwn(IDEA_STATUS, status)) throw new Error("État d'idée inconnu");
  Object.assign(idea, { title: name, details: clean(details, 3000), author: clean(author, 120), status, updatedAt: new Date().toISOString() });
  touch(doc);
}

export function validateResourceUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length > 2048) throw new Error("Lien trop long");
  let url;
  try { url = new URL(raw); } catch { throw new Error("Saisissez un lien complet commençant par https://"); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Seuls les liens HTTP(S) sans identifiant sont autorisés");
  return url.href;
}
export function addResource(doc, { title, description = "", url = "" }) {
  const name = requiredTitle(title);
  const validatedUrl = validateResourceUrl(url);
  const id = newId("resource");
  doc.resources ||= {};
  doc.resources[id] = {
    id, title: name, description: clean(description, 3000),
    url: validatedUrl, archived: false, createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}
export function updateResource(doc, id, { title, description = "", url = "" }) {
  const resource = doc.resources?.[id];
  if (!resource || resource.archived) throw new Error("Ressource introuvable");
  const name = requiredTitle(title);
  const validatedUrl = validateResourceUrl(url);
  Object.assign(resource, { title: name, description: clean(description, 3000), url: validatedUrl, updatedAt: new Date().toISOString() });
  touch(doc);
}

export function setEventParticipant(doc, eventId, memberId, attending) {
  const event = doc.events?.[eventId], member = doc.members?.[memberId];
  if (!event || event.archived) throw new Error("Événement introuvable");
  if (!member || member.archived) throw new Error("Membre actif introuvable");
  event.participants ||= {};
  if (attending) event.participants[memberId] = { memberId, addedAt: new Date().toISOString() };
  else delete event.participants[memberId];
  event.updatedAt = new Date().toISOString();
  touch(doc);
}

export function setVolunteerParticipant(doc, needId, memberId, attending) {
  const need = doc.volunteerNeeds?.[needId], member = doc.members?.[memberId];
  if (!need || need.archived) throw new Error("Besoin bénévole introuvable");
  if (!member || member.archived) throw new Error("Membre actif introuvable");
  need.assignments ||= {};
  if (attending) {
    if (need.closed) throw new Error("Ce besoin est clôturé");
    if (!need.assignments[memberId] && Object.keys(need.assignments).length >= need.slots) throw new Error("Toutes les places ont déjà été attribuées");
    need.assignments[memberId] = { memberId, addedAt: new Date().toISOString() };
  } else delete need.assignments[memberId];
  need.updatedAt = new Date().toISOString();
  touch(doc);
}
export function setVolunteerClosed(doc, needId, closed) {
  const need = doc.volunteerNeeds?.[needId];
  if (!need || need.archived) throw new Error("Besoin bénévole introuvable");
  need.closed = Boolean(closed);
  need.updatedAt = new Date().toISOString();
  touch(doc);
}

const icsEscape = value => String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
export function exportEventIcs(event) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(event?.date || ""))) throw new Error("Précisez d’abord la date de l’événement");
  const next = new Date(event.date + "T12:00:00Z");
  if (!Number.isFinite(next.getTime())) throw new Error("Date invalide");
  next.setUTCDate(next.getUTCDate() + 1);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Verger Associations//FR",
    "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + icsEscape(event.id) + "@verger-associations",
    "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""),
    "DTSTART;VALUE=DATE:" + event.date.replace(/-/g, ""),
    "DTEND;VALUE=DATE:" + next.toISOString().slice(0, 10).replace(/-/g, ""),
    "SUMMARY:" + icsEscape(event.title), "LOCATION:" + icsEscape(event.location),
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

function archiveList(items, collection) {
  return items.length
    ? '<details><summary>Archives (' + items.length + ')</summary><ul class="clean-list">' +
      items.map(item => '<li><strong>' + e(item.title) + '</strong><button type="button" class="text-button" data-action="archive-item" data-collection="' + collection + '" data-id="' + e(item.id) + '" data-archived="false">Restaurer</button></li>').join("") +
      "</ul></details>"
    : "";
}
function ideaFields(item) {
  return '<label>Titre<input name="title" required maxlength="240" value="' + e(item?.title || "") + '"></label>' +
    '<label>Précisions<textarea name="details" maxlength="3000" rows="3">' + e(item?.details || "") + '</textarea></label>' +
    '<label>Proposé par (facultatif)<input name="author" maxlength="120" value="' + e(item?.author || "") + '"></label>' +
    (item ? '<label>État<select name="status">' +
      Object.entries(IDEA_STATUS).map(([key, title]) => '<option value="' + key + '"' + (key === item.status ? " selected" : "") + '>' + title + '</option>').join("") +
      "</select></label>" : "");
}
function resourceFields(item) {
  return '<label>Titre<input name="title" required maxlength="240" value="' + e(item?.title || "") + '"></label>' +
    '<label>Note / description<textarea name="description" maxlength="3000" rows="3">' + e(item?.description || "") + '</textarea></label>' +
    '<label>Lien HTTP(S) facultatif<input name="url" type="url" maxlength="2048" placeholder="https://…" value="' + e(item?.url || "") + '"></label>';
}
export function renderIdeas(state) {
  const records = Object.values(state.ideas || {});
  const active = records.filter(item => !item.archived).reverse(), archived = records.filter(item => item.archived);
  const cards = active.map(item =>
    '<article class="subcard"><h3>' + e(item.title) + '</h3><p class="muted">' + e(IDEA_STATUS[item.status] || IDEA_STATUS.new) +
    (item.author ? ' · ' + e(item.author) : "") + '</p>' + (item.details ? '<p>' + e(item.details) + '</p>' : '') +
    '<details><summary>Modifier</summary><form data-form="idea-edit" data-id="' + e(item.id) + '" class="form">' +
    ideaFields(item) + '<div class="button-row"><button>Enregistrer</button><button class="secondary" type="button" data-action="archive-item" data-collection="ideas" data-id="' + e(item.id) + '" data-archived="true">Archiver</button></div></form></details></article>'
  ).join("");
  return heading("Boîte à idées", "Recueillir des propositions pour les futurs projets de l’association.") +
    '<p class="muted">« Retenue » signifie à approfondir, pas une décision officielle. Les noms sont déclaratifs, non authentifiés.</p>' +
    '<div class="grid-2"><article class="card"><h2>Idées proposées</h2><div class="stack">' + (cards || empty("Aucune idée pour le moment.")) +
    '</div>' + archiveList(archived, "ideas") + '</article><article class="card"><h2>Proposer une idée</h2><form data-form="idea" class="form">' +
    ideaFields(null) + '<button>Proposer l’idée</button></form></article></div>';
}
export function renderResources(state) {
  const records = Object.values(state.resources || {});
  const active = records.filter(item => !item.archived).reverse(), archived = records.filter(item => item.archived);
  const cards = active.map(item =>
    '<article class="subcard"><h3>' + e(item.title) + '</h3>' + (item.description ? '<p>' + e(item.description) + '</p>' : '') +
    (item.url && validateResourceUrl(item.url) ? '<p><a href="' + e(item.url) + '" rel="noopener noreferrer" target="_blank">Consulter la ressource (site externe)</a></p>' : '') +
    '<details><summary>Modifier</summary><form data-form="resource-edit" data-id="' + e(item.id) + '" class="form">' +
    resourceFields(item) + '<div class="button-row"><button>Enregistrer</button><button class="secondary" type="button" data-action="archive-item" data-collection="resources" data-id="' + e(item.id) + '" data-archived="true">Archiver</button></div></form></details></article>'
  ).join("");
  return heading("Ressources", "Conserver les liens et notes utiles au fonctionnement collectif.") +
    '<p class="muted">Les notes sont accessibles hors ligne. Les liens externes nécessitent une connexion. Aucun fichier sensible n’est hébergé dans ce module.</p>' +
    '<div class="grid-2"><article class="card"><h2>Ressources communes</h2><div class="stack">' + (cards || empty("Aucune ressource enregistrée.")) +
    '</div>' + archiveList(archived, "resources") + '</article><article class="card"><h2>Ajouter une ressource</h2><form data-form="resource" class="form">' +
    resourceFields(null) + '<button>Ajouter</button></form></article></div>';
}

function memberSelect(kind, id, members) {
  return '<label>Ajouter un membre<select data-assignment-kind="' + kind + '" data-assignment-id="' + e(id) + '">' +
    '<option value="">Choisir un membre</option>' +
    members.map(item => '<option value="' + e(item.id) + '">' + e(item.name) + '</option>').join("") + '</select></label>';
}
export function renderAttendance(state, event) {
  const assigned = Object.keys(event.participants || {});
  const active = Object.values(state.members || {}).filter(member => !member.archived && !assigned.includes(member.id));
  return '<div class="member-assignment"><h3>Participants (' + assigned.length + ')</h3>' +
    (assigned.length ? '<ul class="clean-list">' + assigned.map(id =>
      '<li><span>' + e(state.members?.[id]?.name || "Membre archivé") + '</span>' +
      '<button class="text-button" type="button" data-action="remove-attendance" data-id="' + e(event.id) + '" data-member-id="' + e(id) + '">Retirer</button></li>'
    ).join("") + '</ul>' : '') +
    (active.length ? memberSelect("event", event.id, active) : '') +
    '<button type="button" class="secondary" data-action="export-event-ics" data-id="' + e(event.id) + '">Ajouter à mon agenda (.ics)</button></div>';
}
export function renderVolunteers(state, need) {
  const assigned = Object.keys(need.assignments || {});
  const active = Object.values(state.members || {}).filter(member => !member.archived && !assigned.includes(member.id));
  return '<div class="member-assignment"><strong>' + assigned.length + ' / ' + need.slots + ' place(s) attribuée(s)</strong>' +
    '<progress value="' + Math.min(assigned.length, need.slots) + '" max="' + need.slots + '" aria-label="Places attribuées"></progress>' +
    (assigned.length ? '<ul class="clean-list">' + assigned.map(id =>
      '<li><span>' + e(state.members?.[id]?.name || "Membre archivé") + '</span>' +
      '<button class="text-button" type="button" data-action="remove-volunteer" data-id="' + e(need.id) + '" data-member-id="' + e(id) + '">Retirer</button></li>'
    ).join("") + '</ul>' : '') +
    (active.length && !need.closed && assigned.length < need.slots ? memberSelect("volunteer", need.id, active) : '') +
    '</div>';
}
