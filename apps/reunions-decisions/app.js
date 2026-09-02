"use strict";

(function () {
  const Model = window.VergerModel;
  const state = Model.createState();
  const actor = String(window.webxdc.selfAddr || `local-${Math.random().toString(36).slice(2)}`);
  const actorName = String(window.webxdc.selfName || "Participant").slice(0, 120);
  let logicalClock = 0;
  let showArchived = false;

  const byId = (id) => document.getElementById(id);

  function makeId(prefix) {
    const randomPart =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${randomPart}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function announce(message, isError) {
    const status = byId("connection-status");
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function sendPatch(collection, id, fields, info) {
    logicalClock += 1;
    const timestamp = now();
    const enrichedFields = collection === "meeting"
      ? fields
      : { ...fields, updatedAt: timestamp, updatedBy: actorName };
    const operation = {
      version: 2,
      type: "patch",
      collection,
      id,
      fields: enrichedFields,
      stamp: { counter: logicalClock, actor },
    };

    try {
      window.webxdc.sendUpdate({
        payload: operation,
        info,
        document: Model.currentMeeting(state).title || "Nouvelle réunion",
        summary: Model.summary(state),
      });
      Model.applyPatch(state, operation);
      render();
      announce(`${info} · synchronisé`, false);
    } catch (error) {
      announce(`Modification non envoyée : ${String(error)}`, true);
    }
  }

  function element(tag, options) {
    const node = document.createElement(tag);
    if (options && options.className) node.className = options.className;
    if (options && Object.prototype.hasOwnProperty.call(options, "text")) node.textContent = options.text;
    return node;
  }

  function emptyElement(message) {
    return element("li", { className: "empty-state", text: message });
  }

  function archiveButton(collection, record, label) {
    const button = element("button", { className: "quiet danger", text: record.archived ? "Restaurer" : "Archiver" });
    button.type = "button";
    button.setAttribute("aria-label", `${record.archived ? "Restaurer" : "Archiver"} ${label}`);
    button.addEventListener("click", () => {
      sendPatch(
        collection,
        record.id,
        { archived: !record.archived },
        `${actorName} a ${record.archived ? "restauré" : "archivé"} ${label}`,
      );
    });
    return button;
  }

  function renderDashboard() {
    const meeting = Model.currentMeeting(state);
    const counts = Model.counts(state);
    const steps = [Boolean(meeting.title), counts.agenda > 0, counts.proposals > 0, counts.decisions > 0, counts.actions > 0];
    const completed = steps.filter(Boolean).length;
    byId("progress-label").textContent = `${completed}/5 étapes préparées`;
    byId("meeting-progress").value = completed;
    byId("meeting-progress").max = steps.length;
    byId("decision-total").textContent = String(counts.decisions);
    byId("objection-total").textContent = String(counts.openObjections);
    byId("action-total").textContent = String(counts.actions - counts.actionsDone);
    document.querySelectorAll("[data-step]").forEach((item, index) => {
      item.classList.toggle("is-complete", steps[index]);
    });
  }

  function renderMeeting() {
    const meeting = Model.currentMeeting(state);
    const fields = {
      "meeting-name": meeting.title || "",
      "meeting-date": meeting.date || "",
      "meeting-facilitator": meeting.facilitator || "",
      "meeting-secretary": meeting.secretary || "",
      "archive-reference": meeting.archiveReference || "",
    };
    Object.entries(fields).forEach(([id, value]) => {
      if (document.activeElement !== byId(id)) byId(id).value = value;
    });
  }

  function renderAgenda() {
    const items = Model.records(state, "agenda");
    const list = byId("agenda-list");
    list.replaceChildren();
    if (!items.length) list.append(emptyElement("Aucun point pour le moment."));

    items.forEach((item) => {
      const row = element("li", { className: `item${item.done ? " is-done" : ""}` });
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(item.done);
      checkbox.setAttribute("aria-label", `Marquer « ${item.text} » comme traité`);
      checkbox.addEventListener("change", () => {
        sendPatch("agenda", item.id, { done: checkbox.checked }, `${actorName} a mis à jour l’ordre du jour`);
      });
      const text = element("span", { className: "item-text", text: item.text });
      row.append(checkbox, text, archiveButton("agenda", item, `le point « ${item.text} »`));
      list.append(row);
    });

    const done = items.filter((item) => item.done).length;
    byId("agenda-count").textContent = `${done}/${items.length} traité${done > 1 ? "s" : ""}`;
  }

  function contributionForm(proposal) {
    const form = element("form", { className: "contribution-form" });
    const selectLabel = element("label", { text: "Type de contribution" });
    const select = document.createElement("select");
    Object.entries(Model.CONTRIBUTION_LABELS).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    });
    selectLabel.append(select);

    const textLabel = element("label", { text: "Message" });
    const textarea = document.createElement("textarea");
    textarea.rows = 2;
    textarea.maxLength = 3000;
    textarea.required = true;
    textLabel.append(textarea);

    const button = element("button", { text: "Ajouter la contribution" });
    button.type = "submit";
    form.append(selectLabel, textLabel, button);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = textarea.value.trim();
      if (!text) return;
      sendPatch(
        "contributions",
        makeId("contribution"),
        {
          proposalId: proposal.id,
          type: select.value,
          text,
          author: actorName,
          resolved: false,
          archived: false,
          createdAt: now(),
        },
        `${actorName} a ajouté une contribution`,
      );
      form.reset();
    });
    return form;
  }

  function proposalEditor(proposal) {
    const details = element("details", { className: "editor" });
    const summary = element("summary", { text: "Modifier ou archiver" });
    const form = element("form", { className: "stacked-form compact-form" });

    const titleLabel = element("label", { text: "Titre" });
    const titleInput = document.createElement("input");
    titleInput.value = proposal.title || "";
    titleInput.maxLength = 240;
    titleInput.required = true;
    titleLabel.append(titleInput);

    const detailsLabel = element("label", { text: "Contexte ou formulation complète" });
    const detailsInput = document.createElement("textarea");
    detailsInput.rows = 3;
    detailsInput.maxLength = 5000;
    detailsInput.value = proposal.details || "";
    detailsLabel.append(detailsInput);

    const decisionLabel = element("label", { text: "Décision retenue" });
    const decisionInput = document.createElement("textarea");
    decisionInput.rows = 3;
    decisionInput.maxLength = 5000;
    decisionInput.value = proposal.decisionText || "";
    decisionInput.placeholder = "Formulation exacte à conserver si la proposition est adoptée";
    decisionLabel.append(decisionInput);

    const reviewLabel = element("label", { text: "Date de révision (facultative)" });
    const reviewInput = document.createElement("input");
    reviewInput.type = "date";
    reviewInput.value = proposal.reviewDate || "";
    reviewLabel.append(reviewInput);

    const controls = element("div", { className: "button-row" });
    const save = element("button", { text: "Enregistrer les modifications" });
    save.type = "submit";
    controls.append(save, archiveButton("proposals", proposal, `la proposition « ${proposal.title} »`));
    form.append(titleLabel, detailsLabel, decisionLabel, reviewLabel, controls);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendPatch(
        "proposals",
        proposal.id,
        {
          title: titleInput.value.trim(),
          details: detailsInput.value.trim(),
          decisionText: decisionInput.value.trim(),
          reviewDate: reviewInput.value,
        },
        `${actorName} a modifié une proposition`,
      );
      details.open = false;
    });
    details.append(summary, form);
    return details;
  }

  function renderContributions(proposal, container) {
    const items = Model.records(state, "contributions").filter((item) => item.proposalId === proposal.id);
    const heading = element("h4", { text: `Contributions (${items.length})` });
    const list = element("ul", { className: "contribution-list" });
    if (!items.length) list.append(emptyElement("Aucune clarification, réaction, objection ou proposition d’amendement."));

    items.forEach((item) => {
      const row = element("li", { className: `contribution contribution-${item.type}${item.resolved ? " is-resolved" : ""}` });
      const top = element("div", { className: "contribution-heading" });
      const kind = element("strong", { text: Model.CONTRIBUTION_LABELS[item.type] || item.type });
      const author = element("span", { className: "meta", text: item.author || "Participant" });
      top.append(kind, author);
      const message = element("p", { text: item.text });
      const controls = element("div", { className: "contribution-controls" });
      const resolvedLabel = element("label", { className: "check-label" });
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(item.resolved);
      checkbox.addEventListener("change", () => {
        sendPatch("contributions", item.id, { resolved: checkbox.checked }, `${actorName} a marqué une contribution comme ${checkbox.checked ? "traitée" : "à traiter"}`);
      });
      resolvedLabel.append(checkbox, document.createTextNode(" Traitée"));
      controls.append(resolvedLabel, archiveButton("contributions", item, "cette contribution"));
      row.append(top, message, controls);
      list.append(row);
    });
    container.append(heading, list, contributionForm(proposal));
  }

  function renderProposals() {
    const proposals = Model.records(state, "proposals");
    const list = byId("proposal-list");
    list.replaceChildren();
    if (!proposals.length) {
      const empty = element("p", { className: "empty-state", text: "Aucune proposition pour le moment." });
      list.append(empty);
    }

    proposals.forEach((proposal) => {
      const card = element("article", { className: "proposal-card" });
      const header = element("div", { className: "proposal-heading" });
      const title = element("h3", { text: proposal.title });
      const status = element("span", { className: `status-chip status-${proposal.status}`, text: Model.STATUS_LABELS[proposal.status] || "Brouillon" });
      header.append(title, status);
      card.append(header);

      if (proposal.details) card.append(element("p", { className: "proposal-details", text: proposal.details }));

      const statusLabel = element("label", { className: "status-field", text: "Étape de la proposition" });
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Étape de la proposition « ${proposal.title} »`);
      Object.entries(Model.STATUS_LABELS).forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = proposal.status === value;
        select.append(option);
      });
      select.addEventListener("change", () => {
        sendPatch("proposals", proposal.id, { status: select.value }, `${actorName} : ${Model.STATUS_LABELS[select.value]}`);
      });
      statusLabel.append(select);
      card.append(statusLabel);

      if (proposal.decisionText) {
        const decision = element("div", { className: "decision-box" });
        decision.append(element("strong", { text: "Décision retenue" }), element("p", { text: proposal.decisionText }));
        if (proposal.reviewDate) decision.append(element("p", { className: "meta", text: `Révision prévue : ${proposal.reviewDate}` }));
        card.append(decision);
      } else if (proposal.status === "accepted") {
        card.append(element("p", { className: "warning", text: "Cette proposition est adoptée : ajoutez la formulation exacte de la décision." }));
      }

      card.append(proposalEditor(proposal));
      const contributions = element("section", { className: "contributions" });
      contributions.setAttribute("aria-label", `Contributions à « ${proposal.title} »`);
      renderContributions(proposal, contributions);
      card.append(contributions);
      list.append(card);
    });

    const accepted = proposals.filter((item) => item.status === "accepted").length;
    byId("proposal-count").textContent = `${accepted}/${proposals.length} adoptée${accepted > 1 ? "s" : ""}`;
    renderProposalOptions();
  }

  function renderProposalOptions() {
    const select = byId("action-proposal");
    const previous = select.value;
    select.replaceChildren();
    const none = document.createElement("option");
    none.value = "";
    none.textContent = "Aucune proposition liée";
    select.append(none);
    Model.records(state, "proposals").forEach((proposal) => {
      const option = document.createElement("option");
      option.value = proposal.id;
      option.textContent = proposal.title;
      select.append(option);
    });
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
  }

  function renderActions() {
    const actions = Model.records(state, "actions");
    const proposals = Model.records(state, "proposals", { includeArchived: true });
    const list = byId("action-list");
    list.replaceChildren();
    if (!actions.length) list.append(emptyElement("Aucune action attribuée."));

    actions.forEach((action) => {
      const row = element("li", { className: `item${action.done ? " is-done" : ""}` });
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(action.done);
      checkbox.setAttribute("aria-label", `Marquer « ${action.text} » comme terminée`);
      checkbox.addEventListener("change", () => {
        sendPatch("actions", action.id, { done: checkbox.checked }, `${actorName} a mis à jour une action`);
      });
      const main = element("div", { className: "item-main" });
      main.append(element("div", { className: "item-text", text: action.text }));
      const linked = proposals.find((proposal) => proposal.id === action.proposalId);
      const metadata = [
        action.owner && `Responsable : ${action.owner}`,
        action.due && `Échéance : ${action.due}`,
        linked && `Proposition : ${linked.title}`,
      ].filter(Boolean).join(" · ");
      if (metadata) main.append(element("small", { className: "meta", text: metadata }));
      row.append(checkbox, main, archiveButton("actions", action, `l’action « ${action.text} »`));
      list.append(row);
    });

    const done = actions.filter((item) => item.done).length;
    byId("action-count").textContent = `${done}/${actions.length} terminée${done > 1 ? "s" : ""}`;
  }

  function renderArchived() {
    const groups = [
      ["agenda", "Point"],
      ["proposals", "Proposition"],
      ["contributions", "Contribution"],
      ["actions", "Action"],
    ];
    const archived = groups.flatMap(([collection, label]) =>
      Model.records(state, collection, { includeArchived: true })
        .filter((record) => record.archived)
        .map((record) => ({ collection, label, record })),
    );
    byId("archived-toggle").textContent = `Éléments archivés (${archived.length})`;
    byId("archived-toggle").hidden = archived.length === 0;
    const panel = byId("archived-panel");
    panel.hidden = !showArchived || archived.length === 0;
    const list = byId("archived-list");
    list.replaceChildren();
    archived.forEach(({ collection, label, record }) => {
      const name = record.title || record.text || `${label} sans titre`;
      const row = element("li", { className: "item" });
      row.append(element("span", { className: "item-text", text: `${label} : ${name}` }), archiveButton(collection, record, `« ${name} »`));
      list.append(row);
    });
  }

  function render() {
    renderDashboard();
    renderMeeting();
    renderAgenda();
    renderProposals();
    renderActions();
    renderArchived();
  }

  function slug(value) {
    return (value || "reunion")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "reunion";
  }

  function shareFile(extension, content, label) {
    const meeting = Model.currentMeeting(state);
    try {
      Promise.resolve(window.webxdc.sendToChat({
        file: { name: `${slug(meeting.title)}.${extension}`, plainText: content },
        text: `${label} — ${meeting.title || "Réunion"}`,
      }))
        .then(() => announce(`${label} prêt à être partagé`, false))
        .catch((error) => announce(`Export impossible : ${String(error)}`, true));
    } catch (error) {
      announce(`Export impossible : ${String(error)}`, true);
    }
  }

  byId("meeting-form").addEventListener("submit", (event) => {
    event.preventDefault();
    sendPatch("meeting", "main", {
      title: byId("meeting-name").value.trim(),
      date: byId("meeting-date").value,
      facilitator: byId("meeting-facilitator").value.trim(),
      secretary: byId("meeting-secretary").value.trim(),
      archiveReference: byId("archive-reference").value.trim(),
    }, `${actorName} a mis à jour la réunion`);
  });

  byId("agenda-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = byId("agenda-text");
    const text = input.value.trim();
    if (!text) return;
    sendPatch("agenda", makeId("agenda"), {
      text,
      done: false,
      archived: false,
      createdAt: now(),
    }, `${actorName} a ajouté un point`);
    input.value = "";
    input.focus();
  });

  byId("proposal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const titleInput = byId("proposal-title");
    const title = titleInput.value.trim();
    if (!title) return;
    sendPatch("proposals", makeId("proposal"), {
      title,
      details: byId("proposal-details").value.trim(),
      status: "draft",
      decisionText: "",
      reviewDate: "",
      archived: false,
      createdAt: now(),
    }, `${actorName} a ajouté une proposition`);
    event.currentTarget.reset();
    titleInput.focus();
  });

  byId("action-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const textInput = byId("action-text");
    const text = textInput.value.trim();
    if (!text) return;
    sendPatch("actions", makeId("action"), {
      proposalId: byId("action-proposal").value,
      text,
      owner: byId("action-owner").value.trim(),
      due: byId("action-due").value,
      done: false,
      archived: false,
      createdAt: now(),
    }, `${actorName} a ajouté une action`);
    event.currentTarget.reset();
    renderProposalOptions();
    textInput.focus();
  });

  byId("export-markdown").addEventListener("click", () => {
    shareFile("md", Model.markdownExport(state), "Relevé de travail");
  });

  byId("export-json").addEventListener("click", () => {
    shareFile("json", Model.jsonExport(state), "Données structurées");
  });

  byId("archived-toggle").addEventListener("click", () => {
    showArchived = !showArchived;
    byId("archived-toggle").setAttribute("aria-expanded", String(showArchived));
    renderArchived();
  });

  Promise.resolve(window.webxdc.setUpdateListener((update) => {
    const operation = update && update.payload;
    if (operation && operation.stamp) {
      logicalClock = Math.max(logicalClock, Number(operation.stamp.counter) || 0);
    }
    if (Model.applyPatch(state, operation)) render();
  }, 0))
    .then(() => {
      render();
      announce(`État partagé chargé · ${actorName}`, false);
    })
    .catch((error) => announce(`Chargement impossible : ${String(error)}`, true));
})();
