export const SCHEMA_VERSION = 1;

export const DECISION_METHODS = Object.freeze({
  consent: "Consentement",
  majority: "Majorité simple",
  majorityJudgment: "Jugement majoritaire",
  board: "Décision du bureau",
  consensus: "Consensus",
  other: "Autre méthode",
});

export function newId(prefix = "item") {
  const randomPart = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
}

export function createInitialState(name = "Mon association") {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    organization: {
      id: newId("org"),
      name,
      description: "",
      createdAt: now,
      updatedAt: now,
    },
    members: {},
    meetings: {},
    actions: {},
    events: {},
    volunteerNeeds: {},
    consultations: {},
    alerts: {},
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function ensureState(doc) {
  if (!doc || typeof doc !== "object") throw new Error("Document Verger invalide");
  if (!doc.schemaVersion) doc.schemaVersion = SCHEMA_VERSION;
  if (!doc.organization) {
    doc.organization = { id: newId("org"), name: "Mon association", description: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  for (const key of ["members", "meetings", "actions", "events", "volunteerNeeds", "consultations", "alerts"]) {
    if (!doc[key] || typeof doc[key] !== "object") doc[key] = {};
  }
  if (!doc.metadata) doc.metadata = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  return doc;
}

export function activeRecords(map = {}) {
  return Object.values(map)
    .filter((item) => item && !item.archived)
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || String(a.id || "").localeCompare(String(b.id || "")));
}

export function counts(doc) {
  const members = activeRecords(doc.members);
  const meetings = activeRecords(doc.meetings);
  const actions = activeRecords(doc.actions);
  const events = activeRecords(doc.events);
  const volunteerNeeds = activeRecords(doc.volunteerNeeds);
  const decisions = meetings.flatMap((meeting) => activeRecords(meeting.proposals || {})).filter((proposal) => proposal.status === "accepted");
  return {
    members: members.length,
    meetings: meetings.length,
    openActions: actions.filter((action) => !action.done).length,
    events: events.length,
    volunteerNeeds: volunteerNeeds.filter((need) => !need.closed).length,
    decisions: decisions.length,
  };
}

export function addMember(doc, { name, role = "Membre", contact = "" }) {
  const trimmed = String(name || "").trim();
  if (!trimmed) throw new Error("Le nom du membre est obligatoire");
  const id = newId("member");
  doc.members[id] = {
    id,
    name: trimmed.slice(0, 120),
    role: String(role || "Membre").trim().slice(0, 120),
    contact: String(contact || "").trim().slice(0, 180),
    archived: false,
    createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}

export function addMeeting(doc, { title, date = "" }) {
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("Le titre de la réunion est obligatoire");
  const id = newId("meeting");
  doc.meetings[id] = {
    id,
    title: trimmed.slice(0, 180),
    date: String(date || "").slice(0, 10),
    facilitator: "",
    secretary: "",
    archiveReference: "",
    agenda: {},
    proposals: {},
    archived: false,
    createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}

export function addAgendaItem(doc, meetingId, text) {
  const meeting = doc.meetings?.[meetingId];
  if (!meeting) throw new Error("Réunion introuvable");
  if (!meeting.agenda) meeting.agenda = {};
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("Le point d’ordre du jour est obligatoire");
  const id = newId("agenda");
  meeting.agenda[id] = { id, text: trimmed.slice(0, 500), done: false, archived: false, createdAt: new Date().toISOString() };
  touch(doc);
  return id;
}

export function addProposal(doc, meetingId, { title, details = "" }) {
  const meeting = doc.meetings?.[meetingId];
  if (!meeting) throw new Error("Réunion introuvable");
  if (!meeting.proposals) meeting.proposals = {};
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("La proposition est obligatoire");
  const id = newId("proposal");
  meeting.proposals[id] = {
    id,
    title: trimmed.slice(0, 240),
    details: String(details || "").trim().slice(0, 5000),
    status: "draft",
    decisionMethod: "consent",
    decisionText: "",
    reviewDate: "",
    contributions: {},
    archived: false,
    createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}

export function addContribution(doc, meetingId, proposalId, { type = "reaction", text, author = "" }) {
  const proposal = doc.meetings?.[meetingId]?.proposals?.[proposalId];
  if (!proposal) throw new Error("Proposition introuvable");
  if (!proposal.contributions) proposal.contributions = {};
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("La contribution est obligatoire");
  const allowed = ["clarification", "reaction", "objection", "amendment"];
  const id = newId("contribution");
  proposal.contributions[id] = {
    id,
    type: allowed.includes(type) ? type : "reaction",
    text: trimmed.slice(0, 3000),
    author: String(author || "").trim().slice(0, 120),
    resolved: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}

export function recordDecision(doc, meetingId, proposalId, { status, method, text = "", reviewDate = "" }) {
  const proposal = doc.meetings?.[meetingId]?.proposals?.[proposalId];
  if (!proposal) throw new Error("Proposition introuvable");
  if (!["accepted", "rejected", "discussion", "objection", "amendment", "clarification", "draft"].includes(status)) {
    throw new Error("Statut de décision invalide");
  }
  proposal.status = status;
  proposal.decisionMethod = DECISION_METHODS[method] ? method : "other";
  proposal.decisionText = String(text || "").trim().slice(0, 5000);
  proposal.reviewDate = String(reviewDate || "").slice(0, 10);
  proposal.updatedAt = new Date().toISOString();
  touch(doc);
}

export function addAction(doc, { text, owner = "", due = "", meetingId = "", proposalId = "" }) {
  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("L’action est obligatoire");
  const id = newId("action");
  doc.actions[id] = {
    id,
    text: trimmed.slice(0, 1000),
    owner: String(owner || "").trim().slice(0, 120),
    due: String(due || "").slice(0, 10),
    meetingId: String(meetingId || "").slice(0, 180),
    proposalId: String(proposalId || "").slice(0, 180),
    done: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}

export function addEvent(doc, { title, date = "", location = "" }) {
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("Le titre de l’événement est obligatoire");
  const id = newId("event");
  doc.events[id] = {
    id,
    title: trimmed.slice(0, 180),
    date: String(date || "").slice(0, 10),
    location: String(location || "").trim().slice(0, 240),
    participants: {},
    archived: false,
    createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}

export function addVolunteerNeed(doc, { title, slots = 1, eventId = "" }) {
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("Le besoin bénévole est obligatoire");
  const id = newId("volunteer");
  doc.volunteerNeeds[id] = {
    id,
    title: trimmed.slice(0, 240),
    slots: Math.max(1, Math.min(999, Number(slots) || 1)),
    eventId: String(eventId || "").slice(0, 180),
    assignments: {},
    closed: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };
  touch(doc);
  return id;
}

export function exportPortableJson(doc) {
  return JSON.stringify({
    format: "verger-associations",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: doc,
  }, null, 2);
}

export function importPortableJson(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!parsed || parsed.format !== "verger-associations" || !parsed.data) throw new Error("Fichier Verger invalide");
  if (Number(parsed.schemaVersion) > SCHEMA_VERSION) throw new Error("Cette sauvegarde a été créée avec une version plus récente de Verger");
  return parsed.data;
}

export function touch(doc) {
  const now = new Date().toISOString();
  if (!doc.metadata) doc.metadata = { createdAt: now, updatedAt: now };
  doc.metadata.updatedAt = now;
  if (doc.organization) doc.organization.updatedAt = now;
}
