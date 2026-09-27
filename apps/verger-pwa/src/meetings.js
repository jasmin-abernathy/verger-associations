import { activeRecords } from "./domain.js";
import { contributionLabel, empty, escapeHtml as e, formatDate, methodOptions, nl, statusOptions } from "./helpers.js";

export function meetingCard(meeting) {
  const agenda = activeRecords(meeting.agenda || {});
  const proposals = activeRecords(meeting.proposals || {});
  return `<article class="card meeting-card">
    <div class="card-head"><div><h2>${e(meeting.title)}</h2><p class="muted">${formatDate(meeting.date)}</p></div><span class="badge">${proposals.length} proposition${proposals.length > 1 ? "s" : ""}</span></div>
    <details><summary>Ordre du jour (${agenda.length})</summary>
      ${agenda.length ? `<ul class="clean-list">${agenda.map((item) => `<li class="check-row"><input type="checkbox" ${item.done ? "checked" : ""} data-toggle-agenda="${e(item.id)}" data-meeting-id="${e(meeting.id)}" aria-label="Marquer ${e(item.text)} comme traité"><span>${e(item.text)}</span></li>`).join("")}</ul>` : empty("Aucun point.")}
      <form data-form="agenda" data-meeting-id="${e(meeting.id)}" class="form inline"><label>Nouveau point<input name="text" required maxlength="500"></label><button>Ajouter</button></form>
    </details>
    <details open><summary>Propositions et décisions (${proposals.length})</summary>
      <div class="stack">${proposals.map((proposal) => proposalCard(meeting, proposal)).join("")}</div>
      <form data-form="proposal" data-meeting-id="${e(meeting.id)}" class="form"><label>Nouvelle proposition<input name="title" required maxlength="240"></label><label>Contexte<textarea name="details" maxlength="5000" rows="2"></textarea></label><button>Ajouter la proposition</button></form>
    </details>
  </article>`;
}

function proposalCard(meeting, proposal) {
  const contributions = activeRecords(proposal.contributions || {});
  const statusLabel = ({ draft: "Brouillon", clarification: "À clarifier", discussion: "En discussion", objection: "Objection", amendment: "À amender", accepted: "Adoptée", rejected: "Rejetée" })[proposal.status] || proposal.status;
  return `<section class="subcard">
    <div class="card-head"><h3>${e(proposal.title)}</h3><span class="badge status-${e(proposal.status)}">${e(statusLabel)}</span></div>
    ${proposal.details ? `<p>${nl(proposal.details)}</p>` : ""}
    ${contributions.length ? `<ul class="contributions">${contributions.map((c) => `<li><strong>${e(contributionLabel(c.type))}</strong>${c.author ? ` · ${e(c.author)}` : ""}<br>${nl(c.text)}</li>`).join("")}</ul>` : ""}
    <form data-form="contribution" data-meeting-id="${e(meeting.id)}" data-proposal-id="${e(proposal.id)}" class="form compact">
      <label>Contribution<select name="type"><option value="clarification">Clarification</option><option value="reaction">Réaction</option><option value="objection">Objection</option><option value="amendment">Amendement</option></select></label>
      <label>Auteur<input name="author" maxlength="120"></label>
      <label class="wide">Texte<textarea name="text" required maxlength="3000" rows="2"></textarea></label><button>Ajouter</button>
    </form>
    <form data-form="decision" data-meeting-id="${e(meeting.id)}" data-proposal-id="${e(proposal.id)}" class="form decision-form">
      <label>État<select name="status">${statusOptions(proposal.status)}</select></label>
      <label>Méthode<select name="method">${methodOptions(proposal.decisionMethod)}</select></label>
      <label>Date de révision<input name="reviewDate" type="date" value="${e(proposal.reviewDate || "")}"></label>
      <label class="wide">Décision retenue<textarea name="text" maxlength="5000" rows="2">${e(proposal.decisionText || "")}</textarea></label><button>Enregistrer la décision</button>
    </form>
    <form data-form="action" class="form inline">
      <input type="hidden" name="meetingId" value="${e(meeting.id)}"><input type="hidden" name="proposalId" value="${e(proposal.id)}">
      <label>Créer une action<input name="text" required maxlength="1000"></label><label>Responsable<input name="owner" maxlength="120"></label><label>Échéance<input name="due" type="date"></label><button>Ajouter</button>
    </form>
  </section>`;
}
