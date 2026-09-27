import { DECISION_METHODS, activeRecords, counts } from "./domain.js";
import { empty, escapeHtml as e, formatDate, heading, stat } from "./helpers.js";
import { meetingCard } from "./meetings.js";

export function renderView(name, state, context) {
  const renderers = { dashboard, members, meetings, decisions, actions, events, volunteers, more, settings };
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
  return `${heading("Membres", "Un annuaire minimal avant de définir des permissions plus fines.")}
    <div class="grid-2"><article class="card">${list.length ? `<ul class="clean-list">${list.map((m) => `<li><strong>${e(m.name)}</strong><span>${e(m.role || "Membre")}${m.contact ? ` · ${e(m.contact)}` : ""}</span></li>`).join("")}</ul>` : empty("Aucun membre.")}</article>
    <article class="card"><h2>Ajouter</h2><form data-form="member" class="form"><label>Nom<input name="name" required maxlength="120"></label><label>Rôle<input name="role" maxlength="120" value="Membre"></label><label>Contact facultatif<input name="contact" maxlength="180"></label><button>Ajouter le membre</button></form></article></div>`;
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
  const meetingsList = activeRecords(state.meetings);
  return `${heading("Actions", "Les suites de réunion et les tâches quotidiennes au même endroit.")}
    <div class="grid-2"><article class="card">${list.length ? `<ul class="clean-list">${list.map(actionRow).join("")}</ul>` : empty("Aucune action.")}</article>
    <article class="card"><h2>Nouvelle action</h2><form data-form="action" class="form"><label>Action<input name="text" required maxlength="1000"></label><label>Responsable<input name="owner" maxlength="120"></label><label>Échéance<input name="due" type="date"></label><label>Réunion liée<select name="meetingId"><option value="">Aucune</option>${meetingsList.map((m) => `<option value="${e(m.id)}">${e(m.title)}</option>`).join("")}</select></label><input type="hidden" name="proposalId" value=""><button>Ajouter</button></form></article></div>`;
}

function events(state) {
  const list = activeRecords(state.events).reverse();
  return `${heading("Événements", "Dates et informations pratiques, sans calendrier externe obligatoire.")}<div class="grid-2"><article class="card">${list.length ? `<ul class="clean-list">${list.map((item) => `<li><strong>${e(item.title)}</strong><span>${formatDate(item.date)}${item.location ? ` · ${e(item.location)}` : ""}</span></li>`).join("")}</ul>` : empty("Aucun événement.")}</article><article class="card"><h2>Ajouter</h2><form data-form="event" class="form"><label>Titre<input name="title" required maxlength="180"></label><label>Date<input name="date" type="date"></label><label>Lieu<input name="location" maxlength="240"></label><button>Créer l’événement</button></form></article></div>`;
}

function volunteers(state) {
  const needs = activeRecords(state.volunteerNeeds);
  const eventList = activeRecords(state.events);
  return `${heading("Bénévolat", "Exprimer les besoins avant de construire une gestion complexe.")}<div class="grid-2"><article class="card">${needs.length ? `<ul class="clean-list">${needs.map((need) => `<li><strong>${e(need.title)}</strong><span>${need.slots} personne${need.slots > 1 ? "s" : ""} recherchée${need.slots > 1 ? "s" : ""}${need.closed ? " · clôturé" : ""}</span>${!need.closed ? `<button class="text-button" type="button" data-action="close-volunteer" data-id="${e(need.id)}">Clôturer</button>` : ""}</li>`).join("")}</ul>` : empty("Aucun besoin ouvert.")}</article><article class="card"><h2>Nouveau besoin</h2><form data-form="volunteer" class="form"><label>Besoin<input name="title" required maxlength="240"></label><label>Nombre de personnes<input name="slots" type="number" min="1" max="999" value="1"></label><label>Événement lié<select name="eventId"><option value="">Aucun</option>${eventList.map((item) => `<option value="${e(item.id)}">${e(item.title)}</option>`).join("")}</select></label><button>Ajouter</button></form></article></div>`;
}

function more() {
  return `${heading("Autres modules", "Le socle est prêt à accueillir les fonctions validées par le pilote.")}<div class="module-grid">${[
    ["Accueil","Parcours d’arrivée, documents et premières tâches."],["Entraide","Demandes, offres et mise en relation."],["Consultations","Questionnaires nominatifs ou anonymes."],["Signalements","Remontée et suivi d’un problème."],["Alertes","Qualification d’alertes externes."],["Jugement majoritaire","Urne Mieux Voter puis import du résultat agrégé."],
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

function actionRow(action) {
  return `<li class="check-row"><input type="checkbox" ${action.done ? "checked" : ""} data-toggle-action="${e(action.id)}" aria-label="Marquer ${e(action.text)} comme terminée"><div><strong class="${action.done ? "done" : ""}">${e(action.text)}</strong><span>${action.owner ? `Responsable : ${e(action.owner)}` : "Sans responsable"}${action.due ? ` · ${formatDate(action.due)}` : ""}</span></div></li>`;
}
