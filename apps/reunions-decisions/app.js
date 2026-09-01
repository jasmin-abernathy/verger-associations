"use strict";

(function () {
  const STATUS_LABELS = {
    draft: "Brouillon",
    discussion: "En discussion",
    objection: "Objection à traiter",
    accepted: "Adoptée",
    rejected: "Rejetée",
  };

  const state = {
    meeting: {},
    agenda: {},
    proposals: {},
    actions: {},
  };

  const actor = window.webxdc.selfAddr || `local-${Math.random().toString(36).slice(2)}`;
  const actorName = window.webxdc.selfName || "Participant";
  let logicalClock = 0;

  const byId = (id) => document.getElementById(id);

  function makeId(prefix) {
    const randomPart =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${randomPart}`;
  }

  function compareStamps(left, right) {
    if (!right) return 1;
    if (left.counter !== right.counter) return left.counter - right.counter;
    return String(left.actor).localeCompare(String(right.actor));
  }

  function applyPatch(operation) {
    if (
      !operation ||
      operation.version !== 1 ||
      operation.type !== "patch" ||
      !Object.prototype.hasOwnProperty.call(state, operation.collection) ||
      !operation.id ||
      !operation.fields ||
      !operation.stamp
    ) {
      return;
    }

    logicalClock = Math.max(logicalClock, Number(operation.stamp.counter) || 0);
    const collection = state[operation.collection];
    const record = collection[operation.id] || { id: operation.id, _meta: {} };

    Object.entries(operation.fields).forEach(([field, value]) => {
      if (compareStamps(operation.stamp, record._meta[field]) > 0) {
        record[field] = value;
        record._meta[field] = operation.stamp;
      }
    });

    collection[operation.id] = record;
  }

  function sendPatch(collection, id, fields, info) {
    logicalClock += 1;
    const operation = {
      version: 1,
      type: "patch",
      collection,
      id,
      fields,
      stamp: {
        counter: logicalClock,
        actor,
      },
    };

    window.webxdc.sendUpdate(
      {
        payload: operation,
        info,
        document: currentMeeting().title || "Nouvelle réunion",
        summary: buildSummary(),
      },
      "",
    );
  }

  function records(collection) {
    return Object.values(state[collection]).sort((left, right) =>
      String(left.createdAt || "").localeCompare(String(right.createdAt || "")),
    );
  }

  function currentMeeting() {
    return state.meeting.main || { title: "", date: "" };
  }

  function buildSummary() {
    const accepted = records("proposals").filter((item) => item.status === "accepted").length;
    const openActions = records("actions").filter((item) => !item.done).length;
    return `${accepted} décision${accepted > 1 ? "s" : ""} · ${openActions} action${openActions > 1 ? "s" : ""}`;
  }

  function emptyElement(message) {
    const element = document.createElement("li");
    element.className = "empty-state";
    element.textContent = message;
    return element;
  }

  function renderMeeting() {
    const meeting = currentMeeting();
    if (document.activeElement !== byId("meeting-name")) {
      byId("meeting-name").value = meeting.title || "";
    }
    if (document.activeElement !== byId("meeting-date")) {
      byId("meeting-date").value = meeting.date || "";
    }
  }

  function renderAgenda() {
    const items = records("agenda");
    const list = byId("agenda-list");
    list.replaceChildren();

    if (!items.length) {
      list.append(emptyElement("Aucun point pour le moment."));
    }

    items.forEach((item) => {
      const row = document.createElement("li");
      row.className = `item${item.done ? " is-done" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(item.done);
      checkbox.setAttribute("aria-label", `Marquer « ${item.text} » comme traité`);
      checkbox.addEventListener("change", () => {
        sendPatch("agenda", item.id, { done: checkbox.checked }, `${actorName} a mis à jour l’ordre du jour`);
      });

      const text = document.createElement("span");
      text.className = "item-text";
      text.textContent = item.text;

      row.append(checkbox, text);
      list.append(row);
    });

    const done = items.filter((item) => item.done).length;
    byId("agenda-count").textContent = `${done}/${items.length} traité${done > 1 ? "s" : ""}`;
  }

  function renderProposals() {
    const proposals = records("proposals");
    const list = byId("proposal-list");
    list.replaceChildren();

    if (!proposals.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Aucune proposition pour le moment.";
      list.append(empty);
    }

    proposals.forEach((proposal) => {
      const card = document.createElement("article");
      card.className = "proposal-card";

      const title = document.createElement("h3");
      title.textContent = proposal.title;
      card.append(title);

      if (proposal.details) {
        const details = document.createElement("p");
        details.textContent = proposal.details;
        card.append(details);
      }

      const controls = document.createElement("div");
      controls.className = "proposal-controls";

      const label = document.createElement("label");
      label.textContent = "Statut";

      const select = document.createElement("select");
      select.setAttribute("aria-label", `Statut de la proposition « ${proposal.title} »`);
      Object.entries(STATUS_LABELS).forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        option.selected = proposal.status === value;
        select.append(option);
      });
      select.addEventListener("change", () => {
        sendPatch(
          "proposals",
          proposal.id,
          { status: select.value },
          `${actorName} : ${STATUS_LABELS[select.value]}`,
        );
      });

      label.append(select);
      controls.append(label);
      card.append(controls);
      list.append(card);
    });

    const accepted = proposals.filter((item) => item.status === "accepted").length;
    byId("proposal-count").textContent = `${accepted}/${proposals.length} adoptée${accepted > 1 ? "s" : ""}`;
  }

  function renderActions() {
    const actions = records("actions");
    const list = byId("action-list");
    list.replaceChildren();

    if (!actions.length) {
      list.append(emptyElement("Aucune action attribuée."));
    }

    actions.forEach((action) => {
      const row = document.createElement("li");
      row.className = `item${action.done ? " is-done" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(action.done);
      checkbox.setAttribute("aria-label", `Marquer « ${action.text} » comme terminée`);
      checkbox.addEventListener("change", () => {
        sendPatch("actions", action.id, { done: checkbox.checked }, `${actorName} a mis à jour une action`);
      });

      const main = document.createElement("div");
      main.className = "item-main";

      const text = document.createElement("div");
      text.className = "item-text";
      text.textContent = action.text;
      main.append(text);

      const metadata = [action.owner && `Responsable : ${action.owner}`, action.due && `Échéance : ${action.due}`]
        .filter(Boolean)
        .join(" · ");
      if (metadata) {
        const meta = document.createElement("small");
        meta.className = "meta";
        meta.textContent = metadata;
        main.append(meta);
      }

      row.append(checkbox, main);
      list.append(row);
    });

    const done = actions.filter((item) => item.done).length;
    byId("action-count").textContent = `${done}/${actions.length} terminée${done > 1 ? "s" : ""}`;
  }

  function render() {
    renderMeeting();
    renderAgenda();
    renderProposals();
    renderActions();
    byId("connection-status").textContent = `État partagé chargé · ${actorName}`;
  }

  function slug(value) {
    return (value || "reunion")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "reunion";
  }

  function markdownExport() {
    const meeting = currentMeeting();
    const lines = [
      `# ${meeting.title || "Réunion"}`,
      "",
      meeting.date ? `Date : ${meeting.date}` : "Date : à préciser",
      "",
      "## Ordre du jour",
      "",
      ...records("agenda").map((item) => `- [${item.done ? "x" : " "}] ${item.text}`),
      "",
      "## Propositions et décisions",
      "",
    ];

    records("proposals").forEach((proposal) => {
      lines.push(`### ${proposal.title}`, "", `Statut : ${STATUS_LABELS[proposal.status] || proposal.status}`);
      if (proposal.details) lines.push("", proposal.details);
      lines.push("");
    });

    lines.push("## Actions", "");
    records("actions").forEach((action) => {
      const details = [action.owner && `responsable : ${action.owner}`, action.due && `échéance : ${action.due}`]
        .filter(Boolean)
        .join(", ");
      lines.push(`- [${action.done ? "x" : " "}] ${action.text}${details ? ` (${details})` : ""}`);
    });

    lines.push("", "_Relevé de travail généré par Verger Associations. À valider et archiver dans l’espace officiel._", "");
    return lines.join("\n");
  }

  function jsonExport() {
    const cleanRecords = (collection) => records(collection).map(({ _meta, ...record }) => record);
    return JSON.stringify(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        meeting: (() => {
          const { _meta, ...meeting } = currentMeeting();
          return meeting;
        })(),
        agenda: cleanRecords("agenda"),
        proposals: cleanRecords("proposals"),
        actions: cleanRecords("actions"),
      },
      null,
      2,
    );
  }

  function shareFile(extension, content, label) {
    const meeting = currentMeeting();
    window.webxdc
      .sendToChat({
        file: {
          name: `${slug(meeting.title)}.${extension}`,
          plainText: content,
        },
        text: `${label} — ${meeting.title || "Réunion"}`,
      })
      .catch((error) => {
        byId("connection-status").textContent = `Export impossible : ${String(error)}`;
      });
  }

  byId("meeting-form").addEventListener("submit", (event) => {
    event.preventDefault();
    sendPatch(
      "meeting",
      "main",
      {
        title: byId("meeting-name").value.trim(),
        date: byId("meeting-date").value,
      },
      `${actorName} a mis à jour la réunion`,
    );
  });

  byId("agenda-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = byId("agenda-text");
    const text = input.value.trim();
    if (!text) return;
    sendPatch(
      "agenda",
      makeId("agenda"),
      { text, done: false, createdAt: new Date().toISOString() },
      `${actorName} a ajouté un point`,
    );
    input.value = "";
    input.focus();
  });

  byId("proposal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const titleInput = byId("proposal-title");
    const title = titleInput.value.trim();
    if (!title) return;
    sendPatch(
      "proposals",
      makeId("proposal"),
      {
        title,
        details: byId("proposal-details").value.trim(),
        status: "draft",
        createdAt: new Date().toISOString(),
      },
      `${actorName} a ajouté une proposition`,
    );
    event.currentTarget.reset();
    titleInput.focus();
  });

  byId("action-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const textInput = byId("action-text");
    const text = textInput.value.trim();
    if (!text) return;
    sendPatch(
      "actions",
      makeId("action"),
      {
        text,
        owner: byId("action-owner").value.trim(),
        due: byId("action-due").value,
        done: false,
        createdAt: new Date().toISOString(),
      },
      `${actorName} a ajouté une action`,
    );
    event.currentTarget.reset();
    textInput.focus();
  });

  byId("export-markdown").addEventListener("click", () => {
    shareFile("md", markdownExport(), "Relevé de travail");
  });

  byId("export-json").addEventListener("click", () => {
    shareFile("json", jsonExport(), "Données structurées");
  });

  window.webxdc.setUpdateListener((update) => {
    applyPatch(update.payload);
    render();
  }, 0).then(render);
})();
