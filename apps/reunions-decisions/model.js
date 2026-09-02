"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.VergerModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STATUS_LABELS = Object.freeze({
    draft: "Brouillon",
    clarification: "À clarifier",
    discussion: "En discussion",
    objection: "Objection à traiter",
    amendment: "À amender",
    accepted: "Adoptée",
    rejected: "Rejetée",
  });

  const CONTRIBUTION_LABELS = Object.freeze({
    clarification: "Question de clarification",
    reaction: "Réaction",
    objection: "Objection",
    amendment: "Amendement",
  });

  const FIELD_RULES = Object.freeze({
    meeting: {
      title: ["string", 180],
      date: ["string", 10],
      facilitator: ["string", 120],
      secretary: ["string", 120],
      archiveReference: ["string", 300],
    },
    agenda: {
      text: ["string", 500],
      done: ["boolean"],
      archived: ["boolean"],
      createdAt: ["string", 40],
      updatedAt: ["string", 40],
      updatedBy: ["string", 120],
    },
    proposals: {
      title: ["string", 240],
      details: ["string", 5000],
      status: ["enum", Object.keys(STATUS_LABELS)],
      decisionText: ["string", 5000],
      reviewDate: ["string", 10],
      archived: ["boolean"],
      createdAt: ["string", 40],
      updatedAt: ["string", 40],
      updatedBy: ["string", 120],
    },
    contributions: {
      proposalId: ["string", 160],
      type: ["enum", Object.keys(CONTRIBUTION_LABELS)],
      text: ["string", 3000],
      author: ["string", 120],
      resolved: ["boolean"],
      archived: ["boolean"],
      createdAt: ["string", 40],
      updatedAt: ["string", 40],
      updatedBy: ["string", 120],
    },
    actions: {
      proposalId: ["string", 160],
      text: ["string", 1000],
      owner: ["string", 120],
      due: ["string", 10],
      done: ["boolean"],
      archived: ["boolean"],
      createdAt: ["string", 40],
      updatedAt: ["string", 40],
      updatedBy: ["string", 120],
    },
  });

  function createDictionary() {
    return Object.create(null);
  }

  function createState() {
    return {
      meeting: createDictionary(),
      agenda: createDictionary(),
      proposals: createDictionary(),
      contributions: createDictionary(),
      actions: createDictionary(),
    };
  }

  function safeId(value) {
    return (
      typeof value === "string" &&
      value.length > 0 &&
      value.length <= 180 &&
      value !== "__proto__" &&
      value !== "prototype" &&
      value !== "constructor"
    );
  }

  function compareStamps(left, right) {
    if (!right) return 1;
    const leftCounter = Number(left && left.counter) || 0;
    const rightCounter = Number(right && right.counter) || 0;
    if (leftCounter !== rightCounter) return leftCounter - rightCounter;
    return String((left && left.actor) || "").localeCompare(String((right && right.actor) || ""));
  }

  function normalizeValue(rule, value) {
    if (!rule) return { accepted: false };
    if (rule[0] === "boolean") return { accepted: typeof value === "boolean", value };
    if (rule[0] === "string") {
      return {
        accepted: typeof value === "string",
        value: typeof value === "string" ? value.slice(0, rule[1]) : "",
      };
    }
    if (rule[0] === "enum") {
      return { accepted: typeof value === "string" && rule[1].includes(value), value };
    }
    return { accepted: false };
  }

  function applyPatch(state, operation) {
    if (
      !state ||
      !operation ||
      ![1, 2].includes(operation.version) ||
      operation.type !== "patch" ||
      !Object.prototype.hasOwnProperty.call(FIELD_RULES, operation.collection) ||
      !safeId(operation.id) ||
      !operation.fields ||
      typeof operation.fields !== "object" ||
      Array.isArray(operation.fields) ||
      !operation.stamp ||
      !Number.isFinite(Number(operation.stamp.counter)) ||
      Number(operation.stamp.counter) < 0 ||
      !safeId(String(operation.stamp.actor || ""))
    ) {
      return false;
    }

    const collection = state[operation.collection];
    if (!collection) return false;
    const existing = collection[operation.id];
    const record = existing || { id: operation.id, _meta: createDictionary() };
    let changed = false;

    Object.entries(operation.fields).forEach(([field, rawValue]) => {
      const normalized = normalizeValue(FIELD_RULES[operation.collection][field], rawValue);
      if (!normalized.accepted || compareStamps(operation.stamp, record._meta[field]) <= 0) return;
      record[field] = normalized.value;
      record._meta[field] = {
        counter: Number(operation.stamp.counter),
        actor: String(operation.stamp.actor),
      };
      changed = true;
    });

    if (changed) collection[operation.id] = record;
    return changed;
  }

  function records(state, collection, options) {
    const includeArchived = Boolean(options && options.includeArchived);
    const source = state && state[collection] ? Object.values(state[collection]) : [];
    return source
      .filter((record) => includeArchived || !record.archived)
      .sort((left, right) => {
        const byDate = String(left.createdAt || "").localeCompare(String(right.createdAt || ""));
        return byDate || String(left.id).localeCompare(String(right.id));
      });
  }

  function currentMeeting(state) {
    return (state && state.meeting && state.meeting.main) || { id: "main", title: "", date: "" };
  }

  function counts(state) {
    const agenda = records(state, "agenda");
    const proposals = records(state, "proposals");
    const contributions = records(state, "contributions");
    const actions = records(state, "actions");
    return {
      agenda: agenda.length,
      agendaDone: agenda.filter((item) => item.done).length,
      proposals: proposals.length,
      decisions: proposals.filter((item) => item.status === "accepted").length,
      openObjections: contributions.filter((item) => item.type === "objection" && !item.resolved).length,
      actions: actions.length,
      actionsDone: actions.filter((item) => item.done).length,
    };
  }

  function summary(state) {
    const value = counts(state);
    const openActions = value.actions - value.actionsDone;
    return `${value.decisions} décision${value.decisions > 1 ? "s" : ""} · ${value.openObjections} objection${value.openObjections > 1 ? "s" : ""} · ${openActions} action${openActions > 1 ? "s" : ""}`;
  }

  function plainRecord(record) {
    const clean = {};
    Object.entries(record || {}).forEach(([key, value]) => {
      if (key !== "_meta") clean[key] = value;
    });
    return clean;
  }

  function formatDate(value) {
    if (!value) return "à préciser";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  }

  function markdownExport(state) {
    const meeting = currentMeeting(state);
    const proposals = records(state, "proposals");
    const contributions = records(state, "contributions");
    const lines = [
      `# ${meeting.title || "Réunion"}`,
      "",
      `Date : ${formatDate(meeting.date)}`,
    ];

    if (meeting.facilitator) lines.push(`Animation : ${meeting.facilitator}`);
    if (meeting.secretary) lines.push(`Prise de notes : ${meeting.secretary}`);
    lines.push("", "## Ordre du jour", "");

    const agenda = records(state, "agenda");
    lines.push(...(agenda.length ? agenda.map((item) => `- [${item.done ? "x" : " "}] ${item.text}`) : ["_Aucun point._"]));
    lines.push("", "## Propositions et décisions", "");

    if (!proposals.length) lines.push("_Aucune proposition._", "");
    proposals.forEach((proposal) => {
      lines.push(`### ${proposal.title}`, "", `Statut : ${STATUS_LABELS[proposal.status] || proposal.status || "Brouillon"}`);
      if (proposal.details) lines.push("", proposal.details);

      const related = contributions.filter((item) => item.proposalId === proposal.id);
      if (related.length) {
        lines.push("", "Contributions :");
        related.forEach((item) => {
          const treated = item.resolved ? " — traitée" : "";
          const author = item.author ? ` — ${item.author}` : "";
          lines.push(`- **${CONTRIBUTION_LABELS[item.type] || item.type}**${author}${treated} : ${item.text}`);
        });
      }
      if (proposal.decisionText) lines.push("", `Décision retenue : ${proposal.decisionText}`);
      if (proposal.reviewDate) lines.push("", `Révision prévue : ${formatDate(proposal.reviewDate)}`);
      lines.push("");
    });

    lines.push("## Actions", "");
    const actions = records(state, "actions");
    if (!actions.length) lines.push("_Aucune action._");
    actions.forEach((action) => {
      const details = [action.owner && `responsable : ${action.owner}`, action.due && `échéance : ${formatDate(action.due)}`]
        .filter(Boolean)
        .join(", ");
      const related = proposals.find((proposal) => proposal.id === action.proposalId);
      lines.push(`- [${action.done ? "x" : " "}] ${action.text}${details ? ` (${details})` : ""}${related ? ` — ${related.title}` : ""}`);
    });

    if (meeting.archiveReference) lines.push("", `Archive officielle : ${meeting.archiveReference}`);
    lines.push("", "_Relevé de travail généré par Verger Associations. À valider et archiver dans l’espace officiel._", "");
    return lines.join("\n");
  }

  function jsonExport(state, exportedAt) {
    return JSON.stringify(
      {
        schemaVersion: 2,
        exportedAt: exportedAt || new Date().toISOString(),
        meeting: plainRecord(currentMeeting(state)),
        agenda: records(state, "agenda", { includeArchived: true }).map(plainRecord),
        proposals: records(state, "proposals", { includeArchived: true }).map(plainRecord),
        contributions: records(state, "contributions", { includeArchived: true }).map(plainRecord),
        actions: records(state, "actions", { includeArchived: true }).map(plainRecord),
      },
      null,
      2,
    );
  }

  return Object.freeze({
    STATUS_LABELS,
    CONTRIBUTION_LABELS,
    createState,
    compareStamps,
    applyPatch,
    records,
    currentMeeting,
    counts,
    summary,
    markdownExport,
    jsonExport,
  });
});
