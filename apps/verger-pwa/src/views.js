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

function consultations(state, context) {
  const authority = context.authority || {};
  const legacy = Object.values(state.consultations || {})
    .filter(Boolean)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  if (authority.publicMode) {
    return `${heading("Résultats publics", "Résultats agrégés d’une consultation clôturée.")}
      ${authority.loading ? '<p class="muted">Chargement des résultats…</p>' : authority.error ? `<p class="warning">${e(authority.error)}</p>` : renderPollResults(authority.publicResults, true)}`;
  }

  if (authority.loading && !authority.account) {
    return `${heading("Consultations", "Choisir dans une liste proposée, avec un compte vérifié.")}
      <article class="card"><p class="muted">Vérification de la session…</p></article>
      ${legacyConsultations(legacy)}`;
  }

  if (!authority.account) {
    return `${heading("Consultations", "Choisir dans une liste proposée, avec un compte vérifié.")}
      <div class="grid-2">
        <article class="card">
          <h2>Se connecter</h2>
          <p class="muted">Le compte sert à appliquer les droits côté serveur. Le rôle métier de la fiche membre reste séparé.</p>
          ${authority.error ? `<p class="warning">${e(authority.error)}</p>` : ""}
          <form data-form="account-login" class="form">
            <label>E-mail<input name="email" type="email" autocomplete="username" required maxlength="254"></label>
            <label>Mot de passe<input name="password" type="password" autocomplete="current-password" required minlength="12"></label>
            <button>Se connecter</button>
          </form>
          <p class="muted">Organisation : <code>${e(state.organization?.id || "")}</code></p>
        </article>
        <article class="card">
          <h2>Accepter une invitation</h2>
          <p class="muted">Le rôle a déjà été choisi par l’administrateur qui a créé l’invitation.</p>
          <form data-form="account-accept-invite" class="form">
            <label>Code d’invitation<input name="token" required autocomplete="off" value="${e(authority.inviteToken || "")}"></label>
            <label>Choisir un mot de passe<input name="password" type="password" autocomplete="new-password" required minlength="12"></label>
            <button>Créer mon compte</button>
          </form>
        </article>
      </div>
      ${legacyConsultations(legacy)}`;
  }

  const account = authority.account;
  const canCreate = ["administrator", "facilitator"].includes(account.role);
  const selected = authority.selectedPoll;

  return `${heading("Consultations", "Un choix unique par compte, modifiable tant que la consultation reste ouverte.")}
    <div class="account-strip">
      <div><strong>${e(account.email)}</strong><span>${e(accountRoleLabel(account.role))}</span></div>
      <button type="button" class="secondary" data-action="account-logout">Se déconnecter</button>
    </div>
    ${authority.error ? `<p class="warning">${e(authority.error)}</p>` : ""}
    ${selected ? pollDetail(selected, authority, account) : pollHome(state, authority, canCreate)}
    ${legacyConsultations(legacy)}`;
}

function pollHome(state, authority, canCreate) {
  const polls = authority.polls || [];
  const members = activeRecords(state.members);
  return `<div class="consultation-layout">
    <section class="stack">
      <article class="card">
        <div class="card-head"><div><h2>Consultations</h2><p class="muted">Les consultations ouvertes apparaissent en premier.</p></div>${canCreate ? '<button type="button" class="secondary" data-action="toggle-poll-create">Créer</button>' : ""}</div>
        ${polls.length ? `<div class="poll-list">${polls.map(pollListItem).join("")}</div>` : empty("Aucune consultation vérifiée.")}
      </article>
      ${authority.account?.role === "administrator" ? `<article class="card"><details><summary>Inviter un compte</summary>
        <form data-form="account-invite" class="form">
          <label>E-mail<input name="email" type="email" required maxlength="254"></label>
          <label>Rôle<select name="role"><option value="member">Membre</option><option value="facilitator">Animateur</option><option value="reader">Lecteur</option><option value="administrator">Administrateur</option></select></label>
          <label>Fiche membre associée <span class="muted">(facultatif)</span><select name="memberId"><option value="">Aucune</option>${members.map((member) => `<option value="${e(member.id)}">${e(member.name)}</option>`).join("")}</select></label>
          <button>Créer le code d’invitation</button>
        </form>
        ${authority.invitationCode ? `<div class="invitation-code"><strong>Code à transmettre</strong><code>${e(authority.invitationCode)}</code><button type="button" class="secondary" data-action="copy-invitation-code" data-code="${e(authority.invitationCode)}">Copier</button></div>` : ""}
      </details></article>` : ""}
    </section>
    ${canCreate ? `<aside class="card poll-create-panel" data-poll-create hidden>
      <div class="card-head"><div><h2>Créer</h2><p class="muted">2 à 8 réponses proposées.</p></div><button type="button" class="text-button" data-action="toggle-poll-create">Fermer</button></div>
      <form data-form="poll-create" class="form">
        <label>Titre<input name="title" required maxlength="240"></label>
        <label>Question<textarea name="question" required maxlength="2000" rows="3"></textarea></label>
        <div>
          <span class="field-label">Réponses proposées</span>
          <div class="option-editor" data-option-list>
            ${pollOptionRow(1, true)}
            ${pollOptionRow(2, true)}
          </div>
          <button type="button" class="secondary" data-action="option-add">Ajouter une réponse</button>
        </div>
        <label>Échéance <span class="muted">(facultative)</span><input name="deadlineAt" type="datetime-local"></label>
        <label>Résultats<select name="resultsVisibility"><option value="members">Membres seulement</option><option value="public_after_close">Page publique après clôture</option></select></label>
        <button>Ouvrir la consultation</button>
      </form>
    </aside>` : ""}
  </div>`;
}

function pollListItem(poll) {
  const status = poll.status === "open" ? "Ouverte" : poll.status === "closed" ? "Clôturée" : "Annulée";
  return `<article class="poll-list-item">
    <button type="button" class="poll-open-button" data-action="open-poll" data-id="${e(poll.id)}">
      <span><strong>${e(poll.title)}</strong><small>${poll.deadlineAt ? `Échéance : ${e(formatDateTime(poll.deadlineAt))} · ` : ""}${poll.responseCount} réponse${poll.responseCount > 1 ? "s" : ""}</small></span>
      <span class="badge">${status}</span>
    </button>
  </article>`;
}

function pollDetail(poll, authority, account) {
  const results = authority.results;
  return `<section class="stack">
    <button type="button" class="text-button" data-action="poll-back">← Toutes les consultations</button>
    <article class="card">
      <div class="card-head"><div><h2>${e(poll.title)}</h2><p>${e(poll.question)}</p></div><span class="badge">${poll.status === "open" ? "Ouverte" : poll.status === "closed" ? "Clôturée" : "Annulée"}</span></div>
      <p class="muted">${poll.responseCount} réponse${poll.responseCount > 1 ? "s" : ""}${poll.deadlineAt ? ` · Échéance : ${e(formatDateTime(poll.deadlineAt))}` : ""}</p>
      ${poll.canEdit ? pollEditForm(poll) : ""}
      ${poll.status === "open" ? pollResponseForm(poll) : ""}
      ${poll.status === "closed" ? renderPollResults(results, false) : ""}
      ${poll.status === "open" && poll.canClose ? '<div class="button-row"><button type="button" data-action="close-poll" data-id="'+e(poll.id)+'">Clôturer la consultation</button></div>' : ""}
      ${poll.status === "open" && account.role === "administrator" ? `<details><summary>Administration</summary><form data-form="poll-cancel" data-id="${e(poll.id)}" class="form"><label>Motif d’annulation<input name="reason" maxlength="500"></label><button class="secondary">Annuler administrativement</button></form></details>` : ""}
      ${poll.status === "closed" && poll.resultsVisibility === "public_after_close" ? `<button type="button" class="secondary" data-action="copy-public-poll-link" data-id="${e(poll.id)}">Copier le lien public des résultats</button>` : ""}
    </article>
  </section>`;
}

function pollEditForm(poll) {
  return `<details><summary>Modifier avant la première réponse</summary>
    <form data-form="poll-edit" data-id="${e(poll.id)}" class="form">
      <label>Titre<input name="title" required maxlength="240" value="${e(poll.title)}"></label>
      <label>Question<textarea name="question" required maxlength="2000" rows="3">${e(poll.question)}</textarea></label>
      <div><span class="field-label">Réponses proposées</span><div class="option-editor" data-option-list>
        ${poll.options.map((option, index) => pollOptionRow(index + 1, true, option.label)).join("")}
      </div><button type="button" class="secondary" data-action="option-add">Ajouter une réponse</button></div>
      <label>Échéance indicative <span class="muted">(facultative)</span><input name="deadlineAt" type="datetime-local" value="${e(toLocalDateTime(poll.deadlineAt))}"></label>
      <label>Résultats<select name="resultsVisibility"><option value="members" ${poll.resultsVisibility === "members" ? "selected" : ""}>Membres seulement</option><option value="public_after_close" ${poll.resultsVisibility === "public_after_close" ? "selected" : ""}>Page publique après clôture</option></select></label>
      <button>Enregistrer les modifications</button>
    </form>
  </details>`;
}

function pollResponseForm(poll) {
  if (!poll.canRespond) return '<p class="muted">Votre rôle permet de consulter cette question, mais pas d’y répondre.</p>';
  return `<form data-form="poll-response" data-id="${e(poll.id)}" class="form">
    <fieldset class="radio-group"><legend>Votre choix</legend>
      ${poll.options.map((option) => `<label class="radio-choice"><input type="radio" name="optionId" value="${e(option.id)}" ${poll.myOptionId === option.id ? "checked" : ""} required><span>${e(option.label)}</span></label>`).join("")}
    </fieldset>
    <button>${poll.myOptionId ? "Modifier mon choix" : "Enregistrer mon choix"}</button>
    <p class="muted">Votre réponse n’est comptabilisée qu’après confirmation du serveur.</p>
  </form>`;
}

function renderPollResults(results, publicView) {
  if (!results) return '<p class="muted">Chargement des résultats…</p>';
  if (!results.total) {
    return `<section class="poll-results"><h2>Résultats${publicView ? " publics" : ""}</h2><p>Aucune réponse enregistrée.</p></section>`;
  }
  const colors = ["#315f3a","#557a46","#7e944e","#a5a55d","#94764c","#756057","#5f6c7a","#6d5b83"];
  let cursor = 0;
  const stops = results.options.map((option, index) => {
    const start = Math.min(100, cursor);
    cursor = index === results.options.length - 1 ? 100 : Math.min(100, cursor + option.percent);
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  }).join(", ");
  return `<section class="poll-results"><h2>Résultats${publicView ? " publics" : ""}</h2><p><strong>${results.total}</strong> réponse${results.total > 1 ? "s" : ""}</p>
    <div class="poll-result-grid">
      <div class="poll-chart" style="background:conic-gradient(${stops})" aria-hidden="true"></div>
      <ul class="poll-legend">${results.options.map((option, index) => `<li><span class="legend-swatch" style="background:${colors[index % colors.length]}" aria-hidden="true"></span><span><strong>${e(option.label)}</strong> — ${option.count} (${option.percent} %)</span></li>`).join("")}</ul>
    </div>
  </section>`;
}

function legacyConsultations(items) {
  if (!items.length) return "";
  return `<details class="card legacy-consultations"><summary>Anciennes consultations expérimentales (${items.length})</summary>
    <p class="warning">Ces éléments proviennent de l’ancien format Automerge. Les noms et réponses n’ont pas été vérifiés par un compte serveur et ne constituent pas des votes authentifiés.</p>
    <ul class="clean-list">${items.map((item) => `<li><strong>${e(item.title || "Consultation")}</strong><span>${e(item.question || "")} · ${Object.keys(item.responses || {}).length} réponse(s)</span></li>`).join("")}</ul>
  </details>`;
}

function pollOptionRow(position, required = false, value = "") {
  return `<div class="option-row" data-option-row><span class="option-position">${position}</span><input name="option" maxlength="240" ${required ? "required" : ""} value="${e(value)}" aria-label="Réponse proposée ${position}"><div class="option-buttons"><button type="button" class="text-button" data-action="option-up" aria-label="Monter cette réponse">↑</button><button type="button" class="text-button" data-action="option-down" aria-label="Descendre cette réponse">↓</button><button type="button" class="text-button" data-action="option-remove" aria-label="Retirer cette réponse">×</button></div></div>`;
}

function accountRoleLabel(role) {
  return ({ administrator: "Administrateur", facilitator: "Animateur", member: "Membre", reader: "Lecteur" })[role] || role;
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "";
  try { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return value; }
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
      <article class="card"><h2>Sauvegarde et partage</h2><p>Le lien contient l’identifiant du document Automerge. Traite-le comme un lien privé.</p><p class="muted">Importer une sauvegarde ouvre un <strong>nouvel espace</strong> et ne remplace pas silencieusement le document courant. L’export JSON contient l’état métier, pas l’historique CRDT Automerge.</p><div class="button-row"><button type="button" data-action="copy-link">Copier le lien du document</button><button type="button" class="secondary" data-action="export">Exporter JSON</button><button type="button" class="secondary" data-action="import">Importer</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></article>
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
