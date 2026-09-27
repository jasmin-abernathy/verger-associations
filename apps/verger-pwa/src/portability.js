import { activeRecords, createInitialState, importPortableJson, newId, touch } from "./domain.js";

export function exportMeetingMarkdown(doc, meetingId) {
  const meeting = doc.meetings?.[meetingId];
  if (!meeting) throw new Error("Réunion introuvable");
  const proposals = activeRecords(meeting.proposals || {});
  const lines = [`# ${meeting.title || "Réunion"}`, "", `Date : ${formatDate(meeting.date)}`];
  if (meeting.facilitator) lines.push(`Animation : ${meeting.facilitator}`);
  if (meeting.secretary) lines.push(`Prise de notes : ${meeting.secretary}`);
  lines.push("", "## Ordre du jour", "");
  const agenda = activeRecords(meeting.agenda || {});
  lines.push(...(agenda.length ? agenda.map((item) => `- [${item.done ? "x" : " "}] ${item.text}`) : ["_Aucun point._"]));
  lines.push("", "## Propositions et décisions", "");
  if (!proposals.length) lines.push("_Aucune proposition._", "");
  for (const proposal of proposals) {
    lines.push(`### ${proposal.title}`, "", `Statut : ${proposal.status || "draft"}`);
    if (proposal.details) lines.push("", proposal.details);
    const contributions = activeRecords(proposal.contributions || {});
    if (contributions.length) {
      lines.push("", "Contributions :");
      for (const contribution of contributions) {
        const author = contribution.author ? ` — ${contribution.author}` : "";
        const resolved = contribution.resolved ? " — traitée" : "";
        lines.push(`- **${contribution.type || "contribution"}**${author}${resolved} : ${contribution.text}`);
      }
    }
    if (proposal.decisionText) lines.push("", `Décision retenue : ${proposal.decisionText}`);
    if (proposal.reviewDate) lines.push("", `Révision prévue : ${formatDate(proposal.reviewDate)}`);
    lines.push("");
  }
  lines.push("## Actions", "");
  const actions = activeRecords(doc.actions || {}).filter((action) => action.meetingId === meetingId);
  lines.push(...(actions.length ? actions.map((action) => {
    const details = [action.owner && `responsable : ${action.owner}`, action.due && `échéance : ${formatDate(action.due)}`].filter(Boolean).join(", ");
    return `- [${action.done ? "x" : " "}] ${action.text}${details ? ` (${details})` : ""}`;
  }) : ["_Aucune action._"]));
  if (meeting.archiveReference) lines.push("", `Archive officielle : ${meeting.archiveReference}`);
  lines.push("", "_Relevé de travail généré par Verger Associations. À valider avant archivage officiel._", "");
  return lines.join("\n");
}

export function importAnyJson(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (parsed?.format === "verger-associations") return importPortableJson(parsed);
  if (Number(parsed?.schemaVersion) === 2 && parsed?.meeting && Array.isArray(parsed?.proposals)) return migrateWebxdcV02(parsed);
  throw new Error("Fichier Verger invalide");
}

export function migrateWebxdcV02(legacy) {
  const doc = createInitialState(legacy.meeting?.title ? `Import — ${legacy.meeting.title}` : "Import v0.2");
  const meetingId = newId("meeting");
  doc.meetings[meetingId] = {
    id: meetingId,
    title: String(legacy.meeting?.title || "Réunion importée").slice(0, 180),
    date: String(legacy.meeting?.date || "").slice(0, 10),
    facilitator: String(legacy.meeting?.facilitator || "").slice(0, 120),
    secretary: String(legacy.meeting?.secretary || "").slice(0, 120),
    archiveReference: String(legacy.meeting?.archiveReference || "").slice(0, 300),
    agenda: {}, proposals: {}, archived: false,
    createdAt: legacy.exportedAt || new Date().toISOString(),
  };
  const proposalIds = new Map();
  for (const item of legacy.agenda || []) {
    const id = safeId(item?.id, "agenda");
    doc.meetings[meetingId].agenda[id] = { id, text: String(item?.text || "").slice(0, 500), done: Boolean(item?.done), archived: Boolean(item?.archived), createdAt: item?.createdAt || legacy.exportedAt || new Date().toISOString() };
  }
  for (const item of legacy.proposals || []) {
    const id = safeId(item?.id, "proposal");
    if (item?.id) proposalIds.set(String(item.id), id);
    doc.meetings[meetingId].proposals[id] = {
      id, title: String(item?.title || "Proposition importée").slice(0, 240), details: String(item?.details || "").slice(0, 5000),
      status: String(item?.status || "draft"), decisionMethod: "other", decisionText: String(item?.decisionText || "").slice(0, 5000),
      reviewDate: String(item?.reviewDate || "").slice(0, 10), contributions: {}, archived: Boolean(item?.archived),
      createdAt: item?.createdAt || legacy.exportedAt || new Date().toISOString(),
    };
  }
  for (const item of legacy.contributions || []) {
    const proposalId = proposalIds.get(String(item?.proposalId || ""));
    const proposal = proposalId && doc.meetings[meetingId].proposals[proposalId];
    if (!proposal) continue;
    const id = safeId(item?.id, "contribution");
    proposal.contributions[id] = { id, type: String(item?.type || "reaction"), text: String(item?.text || "").slice(0, 3000), author: String(item?.author || "").slice(0, 120), resolved: Boolean(item?.resolved), archived: Boolean(item?.archived), createdAt: item?.createdAt || legacy.exportedAt || new Date().toISOString() };
  }
  for (const item of legacy.actions || []) {
    const id = safeId(item?.id, "action");
    doc.actions[id] = { id, text: String(item?.text || "").slice(0, 1000), owner: String(item?.owner || "").slice(0, 120), due: String(item?.due || "").slice(0, 10), meetingId, proposalId: proposalIds.get(String(item?.proposalId || "")) || "", done: Boolean(item?.done), archived: Boolean(item?.archived), createdAt: item?.createdAt || legacy.exportedAt || new Date().toISOString() };
  }
  touch(doc);
  return doc;
}

function safeId(value, prefix) {
  const raw = String(value || "");
  return /^[A-Za-z0-9._:-]{1,180}$/.test(raw) && !["__proto__", "prototype", "constructor"].includes(raw) ? raw : newId(prefix);
}

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : (value || "à préciser");
}
