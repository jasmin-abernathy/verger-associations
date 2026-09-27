import { DECISION_METHODS, WELCOME_STEPS, activeRecords, counts } from "./domain.js";
import { empty, escapeHtml as e, formatDate, heading, stat } from "./helpers.js";
import { meetingCard } from "./meetings.js";

export function renderView(name, state, context) {
  const renderers = { dashboard, members, welcome, meetings, decisions, actions, events, volunteers, help, consultations, more, settings };
  return renderers[name]?.(state, context) || "";
}

function dashboard(state) {
  const c = counts(state);
  const nextActions = activeRecords(state.actions).filter((item) => !item.done).slice(0, 5);
  return `${heading("Accueil", "Une vue simple de ce qui demande de l’attention.")}
    <div class="stats">${stat(c.members,"membres")}${stat(c.meetings,"réunions")}${stat(c.decisions,"décisions")}${stat(c.openActions,"actions ouvertes")}${stat(c.events,"événements")}${stat(c.volunteerNeeds,"besoins bénévoles")}</div>
    <div class="grid-2"><article class="card"><h2>À faire</h2>${nextActions.length ? `<ul class="clean-list">${nextActions.map(actionRow).join("")}</ul>` : empty("Aucune action ouverte.")}</article>
    <article class="card"><h2>Principe du Verger</h2><p>Les données sont enregistrées d’abord sur cet appareil. La connexion sert à synchroniser, pas à rendre l’application utilisable.</p><p class="muted">Aucun compte externe, aucune publicité, aucune télémétrie.</p></article></div>`;
}

function members(state) {
  const list = activeRecords(state.members);
  const archived = archivedRecords(state.members);
  return `${heading("Membres", "Un annuaire minimal avant de définir des permissions plus fines.")}
    <div class="grid-2"><article class="card"><h2>Membres actifs</h2>${list.length ? `<div class="stack">${list.map((m) => `<article class="subcard"><form data-form="member-edit" data-id="${e(m.id)}" class="form"><label>Nom<input name="name" required maxlength="120" value="${e(m.name)}"></label><label>Rôle<input name="role" maxlength="120" value="${e(m.role || "Membre")}"></label><label>Contact facultatif<input name="contact" maxlength="180" value="${e(m.contact || "")}"></label><div class="button-row"><button>Enregistrer</button><button type="button" class="secondary" data-action="archive-item" data-collection="members" data-id="${e(m.id)}" data-archived="true">Archiver</button></div></form></article>`).join("")}</div>` : empty("Aucun membre.")}${archivedList("Membres archivés", archived, "members", (m) => m.name)}</article>
    <article class="card"><h2>Ajouter</h2><form data-form="member" class="form"><label>Nom<input name="name" required maxlength="120"></label><label>Rôle<input name="role" maxlength="120" value="Membre"></label><label>Contact facultatif<input name="contact" maxlength="180"></label><button>Ajouter le membre</button></form></article></div>`;
}

function welcome(state) {
  const list = activeRecords(state.members);
  return `${heading("Accueil", "Suivre les premières étapes avec chaque nouveau membre.")}
    <p class="muted">Cette liste est partagée avec toutes les personnes qui accèdent à l’association. Elle ne transmet aucun document automatiquement.</p>
    <div class="stack">${list.length ? list.map((member) => `<article class="card"><h2>${e(member.name)}</h2><p class="muted">${e(member.role || "Membre")}</p>
      <div class="form">${Object.entries(WELCOME_STEPS).map(([step, label]) => `<label><input type="checkbox" data-member-id="${e(member.id)}" data-welcome-step="${step}" ${member.welcome?.[step] ? "checked" : ""}> ${label}</label>`).join("")}</div></article>`).join("") : empty("Ajoutez d’abord un membre.")}</div>`;
}

function meetings(state) {
  const list = activeRecords(state.meetings).reverse();
  return `${heading("Réunions", "Préparer, délibérer, décider et créer les suites dans le même espace.")}
    <article class="card"><h2>Nouvelle réunion</h2><form data-form="meeting" class="form inline"><label>Titre<input name="title" required maxlength="180"></label><label>Date<input name="date" type="date"></label><button>Créer</button></form></article>
    <div class="stack">${list.length ? list.map(meetingCard).join("") : empty("Aucune réunion pour le moment.")}</div>`;
}

function decisions(state) {
  const list = activeRecords(state.meetings).flatMap((meeting) => activeRecords(meeting.proposals || {}).filter((p) => ["accepted","rejected"].includes(p.status)).map((proposal) => ({ meeting, proposal })));
  return `${heading("Décisions", "Chaque décision reste reliée à sa réunion et à sa proposition.")}${list.length ? `<div class="stack">${list.map(({meeting,proposal}) => `<article class="card"><div class="card-head"><div><h2>${e(proposal.title)}</h2><p class="muted">${e(meeting.title)} · ${formatDate(meeting.date)}</p></div><span class="badge status-${e(proposal.status)}">${proposal.status === "accepted" ? "Adoptée" : "Rejetée"}</span></div><p><strong>Méthode :</strong> ${e(DECISION_METHODS[proposal.decisionMethod] || "Autre")}</p>${proposal.decisionText ? `<p>${e(proposal.decisionText)}</p>` : `<p class="warning">Formulation finale à compléter.</p>`}</article>`).join("")}</div>` : empty("Aucune décision enregistrée.")}`;
}

function actions(state) {
  const list = activeRecords(state.actions);
  const archived = archivedRecords(state.actions);
  const meetingsList = activeRecords(state.meetings);
  return `${heading("Actions", "Les suites de réunion et les tâches quotidiennes au même endroit.")}
    <div class="grid-2"><article class="card"><h2>Actions</h2>${list.length ? `<div class="stack">${list.map((action) => actionEditor(action, state)).join("")}</div>` : empty("Aucune action.")}${archivedList("Actions archivées", archived, "actions", (item) => item.text)}</article>
    <article class="card"><h2>Nouvelle action</h2><form data-form="action" class="form"><label>Action<input name="text" required maxlength="1000"></label><label>Responsable<input name="owner" maxlength="120"></label><label>Échéance<input name="due" type="date"></label><label>Réunion liée<select name="meetingId"><option value="">Aucune</option>${meetingsList.map((m) => `<option value="${e(m.id)}">${e(m.title)}</option>`).join("")}</select></label><input type="hidden" name="proposalId" value=""><button>Ajouter</button></form></article></div>`;
}

function events(state) {
  const list = activeRecords(state.events).reverse();
  const archived = archivedRecords(state.events);
  return `${heading("Événements", "Dates et informations pratiques, sans calendrier externe obligatoire.")}<div class="grid-2"><article class="card"><h2>Événements</h2>${list.length ? `<div class="stack">${list.map((item) => `<article class="subcard"><form data-form="event-edit" data-id="${e(item.id)}" class="form"><label>Titre<input name="title" required maxlength="180" value="${e(item.title)}"></label><label>Date<input name="date" type="date" value="${e(item.date || "")}"></label><label>Lieu<input name="location" maxlength="240" value="${e(item.location || "")}"></label><div class="button-row"><button>Enregistrer</button><button type="button" class="secondary" data-action="archive-item" data-collection="events" data-id="${e(item.id)}" data-archived="true">Archiver</button></div></form></article>`).join("")}</div>` : empty("Aucun événement.")}${archivedList("Événements archivés", archived, "events", (item) => item.title)}</article><article class="card"><h2>Ajouter</h2><form data-form="event" class="form"><label>Titre<input name="title" required maxlength="180"></label><label>Date<input name="date" type="date"></label><label>Lieu<input name="location" maxlength="240"></label><button>Créer l’événement</button></form></article></div>`;
}

function volunteers(state) {
  const needs = activeRecords(state.volunteerNeeds);
  const eventList = activeRecords(state.events);
  return `${heading("Bénévolat", "Exprimer les besoins avant de construire une gestion complexe.")}<div class="grid-2"><article class="card">${needs.length ? `<ul class="clean-list">${needs.map((need) => `<li><strong>${e(need.title)}</strong><span>${need.slots} personne${need.slots > 1 ? "s" : ""} recherchée${need.slots > 1 ? "s" : ""}${need.closed ? " · clôturé" : ""}</span>${!need.closed ? `<button class="text-button" type="button" data-action="close-volunteer" data-id="${e(need.id)}">Clôturer</button>` : ""}</li>`).join("")}</ul>` : empty("Aucun besoin ouvert.")}</article><article class="card"><h2>Nouveau besoin</h2><form data-form="volunteer" class="form"><label>Besoin<input name="title" required maxlength="240"></label><label>Nombre de personnes<input name="slots" type="number" min="1" max="999" value="1"></label><label>Événement lié<select name="eventId"><option value="">Aucun</option>${eventList.map((item) => `<option value="${e(item.id)}">${e(item.title)}</option>`).join("")}</select></label><button>Ajouter</button></form></article></div>`;
}

function help(state) {
  const posts = activeRecords(state.helpPosts || {}).reverse();
  const archived = archivedRecords(state.helpPosts || {});
  return `${heading("Entraide", "Partager une demande ou une proposition d’aide au sein de l’association.")}
    <p class="muted">Les annonces et leurs coordonnées sont visibles par toutes les personnes ayant accès à cet espace.</p>
    <div class="grid-2"><article class="card"><h2>Annonces</h2>${posts.length ? `<div class="stack">${posts.map((post) => `<article class="subcard"><form data-form="help-edit" data-id="${e(post.id)}" class="form"><label>Type<select name="kind"><option value="request" ${post.kind === "request" ? "selected" : ""}>Demande</option><option value="offer" ${post.kind === "offer" ? "selected" : ""}>Offre</option></select></label><label>Titre<input name="title" required maxlength="240" value="${e(post.title)}"></label><label>Précisions<textarea name="details" maxlength="2000" rows="3">${e(post.details || "")}</textarea></label><label>Contact facultatif<input name="contact" maxlength="180" value="${e(post.contact || "")}"></label><span class="muted">${post.closed ? "Clôturée" : "Ouverte"}</span><div class="button-row"><button>Enregistrer</button><button type="button" class="secondary" data-action="toggle-help" data-id="${e(post.id)}" data-closed="${!post.closed}">${post.closed ? "Rouvrir" : "Clôturer"}</button><button type="button" class="secondary" data-action="archive-item" data-collection="helpPosts" data-id="${e(post.id)}" data-archived="true">Archiver</button></div></form></article>`).join("")}</div>` : empty("Aucune annonce.")}${archivedList("Annonces archivées", archived, "helpPosts", (item) => item.title)}</article>
    <article class="card"><h2>Nouvelle annonce</h2><form data-form="help" class="form"><label>Type<select name="kind"><option value="request">Demande</option><option value="offer">Offre</option></select></label><label>Titre<input name="title" required maxlength="240"></label><label>Précisions<textarea name="details" maxlength="2000" rows="4"></textarea></label><label>Contact facultatif<input name="contact" maxlength="180"></label><button>Publier dans l’association</button></form></article></div>`;
}

function consultations(state) {
  const list = activeRecords(state.consultations || {}).reverse();
  const archived = archivedRecords(state.consultations || {});
  return `${heading("Consultations", "Questions nominatives simples, visibles par les personnes ayant accès à l’association.")}
    <p class="warning"><strong>Pas d’anonymat :</strong> le nom et la réponse sont enregistrés dans le document partagé et son historique. Pour une consultation anonyme, utiliser plus tard un protocole séparé et audité.</p>
    <div class="grid-2"><article class="card"><h2>Consultations</h2>${list.length ? `<div class="stack">${list.map((item) => consultationCard(item)).join("")}</div>` : empty("Aucune consultation.")}${archivedList("Consultations archivées", archived, "consultations", (item) => item.title)}</article>
    <article class="card"><h2>Nouvelle consultation</h2><form data-form="consultation" class="form"><label>Titre<input name="title" required maxlength="240"></label><label>Question<textarea name="question" required maxlength="2000" rows="4"></textarea></label><button>Ouvrir la consultation</button></form></article></div>`;
}

function more() {
  return `${heading("Autres modules", "Le socle est prêt à accueillir les fonctions validées par le pilote.")}<div class="module-grid">${[
    ["Signalements","Remontée et suivi d’un problème."],["Alertes","Qualification d’alertes externes."],["Jugement majoritaire","Urne Mieux Voter puis import du résultat agrégé."],
  ].map(([title,text]) => `<article class="card"><span class="badge">À venir</span><h2>${title}</h2><p>${text}</p></article>`).join("")}</div>`;
}

function settings(state, context) {
  return `${heading("Réglages", "L’application reste utilisable sans serveur. La synchro distante est facultative.")}
    <div class="grid-2">
      <article class="card"><h2>Association</h2><form data-form="organization" class="form"><label>Nom<input name="name" required maxlength="180" value="${e(state.organization.name || "")}"></label><label>Description<textarea name="description" maxlength="1000" rows="3">${e(state.organization.description || "")}</textarea></label><button>Enregistrer</button></form></article>
      <article class="card"><h2>Sauvegarde et partage</h2><p>Le lien contient l’identifiant du document Automerge. Traite-le comme un lien privé.</p><div class="button-row"><button type="button" data-action="copy-link">Copier le lien du document</button><button type="button" class="secondary" data-action="export">Exporter JSON</button><button type="button" class="secondary" data-action="import">Importer</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></article>
      <article class="card"><h2>Synchronisation expérimentale</h2><form data-form="sync" class="form"><label>URL WebSocket<input name="url" type="url" placeholder="wss://sync.exemple.fr/sync" value="${e(context.syncUrl)}"></label><label>Jeton<input name="token" type="password" autocomplete="off" value="${e(context.syncToken)}"></label><button>Enregistrer la synchro</button></form><p class="warning">Le jeton partagé protège le pilote, mais ne remplace pas encore des comptes individuels.</p></article>
      <article class="card"><h2>État technique</h2><dl class="tech"><dt>Document</dt><dd><code>${e(context.docUrl)}</code></dd><dt>Stockage</dt><dd>IndexedDB local</dd><dt>Conflits</dt><dd>Automerge CRDT</dd><dt>Réseau</dt><dd>${context.syncUrl ? "Local + WebSocket" : "Local uniquement"}</dd></dl></article>
    </div>`;
}

function archivedRecords(map = {}) {
  return Object.values(map)
    .filter((item) => item?.archived)
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function archivedList(title, items, collection, label) {
  if (!items.length) return "";
  return `<details class="archive-box"><summary>${e(title)} (${items.length})</summary><ul class="clean-list">${items.map((item) => `<li><strong>${e(label(item))}</strong><button type="button" class="text-button" data-action="archive-item" data-collection="${e(collection)}" data-id="${e(item.id)}" data-archived="false">Restaurer</button></li>`).join("")}</ul></details>`;
}

function actionEditor(action, state) {
  const meeting = state.meetings?.[action.meetingId];
  let proposal = null;
  if (meeting && action.proposalId) proposal = meeting.proposals?.[action.proposalId];
  const context = [
    meeting?.title && `Réunion : ${meeting.title}`,
    proposal?.title && `Décision : ${proposal.title}`,
  ].filter(Boolean).join(" · ");
  return `<article class="subcard"><div class="check-row"><input type="checkbox" ${action.done ? "checked" : ""} data-toggle-action="${e(action.id)}" aria-label="Marquer ${e(action.text)} comme terminée"><div><strong class="${action.done ? "done" : ""}">${e(action.text)}</strong>${context ? `<span>${e(context)}</span>` : ""}</div></div><details><summary>Modifier</summary><form data-form="action-edit" data-id="${e(action.id)}" class="form"><label>Action<input name="text" required maxlength="1000" value="${e(action.text)}"></label><label>Responsable<input name="owner" maxlength="120" value="${e(action.owner || "")}"></label><label>Échéance<input name="due" type="date" value="${e(action.due || "")}"></label><div class="button-row"><button>Enregistrer</button><button type="button" class="secondary" data-action="archive-item" data-collection="actions" data-id="${e(action.id)}" data-archived="true">Archiver</button></div></form></details></article>`;
}

function consultationCard(item) {
  const responses = activeRecords(item.responses || {});
  return `<article class="subcard"><div class="card-head"><div><h3>${e(item.title)}</h3><p>${e(item.question)}</p></div><span class="badge">${item.closed ? "Clôturée" : "Ouverte"}</span></div><h4>Réponses nominatives (${responses.length})</h4>${responses.length ? `<ul class="clean-list">${responses.map((response) => `<li><strong>${e(response.author)}</strong><span>${e(response.answer)}</span></li>`).join("")}</ul>` : empty("Aucune réponse.")}${item.closed ? "" : `<form data-form="consultation-response" data-id="${e(item.id)}" class="form"><label>Votre nom<input name="author" required maxlength="120"></label><label>Réponse<textarea name="answer" required maxlength="4000" rows="3"></textarea></label><button>Répondre nominativement</button></form>`}<div class="button-row"><button type="button" class="secondary" data-action="toggle-consultation" data-id="${e(item.id)}" data-closed="${!item.closed}">${item.closed ? "Rouvrir" : "Clôturer"}</button><button type="button" class="secondary" data-action="archive-item" data-collection="consultations" data-id="${e(item.id)}" data-archived="true">Archiver</button></div></article>`;
}

function actionRow(action) {
  return `<li class="check-row"><input type="checkbox" ${action.done ? "checked" : ""} data-toggle-action="${e(action.id)}" aria-label="Marquer ${e(action.text)} comme terminée"><div><strong class="${action.done ? "done" : ""}">${e(action.text)}</strong><span>${action.owner ? `Responsable : ${e(action.owner)}` : "Sans responsable"}${action.due ? ` · ${formatDate(action.due)}` : ""}</span></div></li>`;
}
