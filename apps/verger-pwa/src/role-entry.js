import { escapeHtml as e } from "./helpers.js";

export const ENTRY_ROLES = Object.freeze([
  { key: "volunteer", title: "Bénévoles", detail: "Se connecter ou demander à rejoindre l’association.", serverRole: "member" },
  { key: "founders", title: "Bureau / fondateurs", detail: "Se connecter à l’espace des membres du bureau et fondateurs.", serverRole: "facilitator" },
  { key: "presidents", title: "Présidence / coprésidence", detail: "Créer l’espace de l’association ou l’administrer.", serverRole: "administrator" },
]);
export function roleForAccount(account) {
  if (account?.role === "administrator") return "presidents";
  if (account?.role === "facilitator") return "founders";
  if (["member", "reader"].includes(account?.role)) return "volunteer";
  return "";
}
export function renderRoleEntry(state, { apiUrl = "", error = "", loading = false } = {}) {
  const home = '<button type="button" class="secondary" data-action="entry-home">Retour aux accès</button>';
  const title = '<header class="view-heading role-intro"><p class="eyebrow">Verger Associations</p><h1>Bienvenue dans votre association 🌱</h1><p>Choisissez votre accès. Les permissions dépendent de votre compte, et non du bouton sélectionné.</p></header>';
  if (state.view === "choices") {
    return title + '<section class="entry-choices" aria-label="Choisir votre accès">' +
      ENTRY_ROLES.map(role => '<button type="button" class="entry-choice" data-action="entry-role" data-role="'+e(role.key)+'"><strong>'+e(role.title)+'</strong><span>'+e(role.detail)+'</span></button>').join("") +
      '</section>';
  }
  const selected = ENTRY_ROLES.find(r => r.key === state.role) || ENTRY_ROLES[0];
  const prefix = title + '<article class="card entry-form"><h2>'+e(selected.title)+'</h2>' +
    (error ? '<p role="alert" class="warning">'+e(error)+'</p>' : '') +
    (loading ? '<p class="muted" role="status">Vérification en cours…</p>' : '');
  if (state.view === "presidents") {
    return prefix + '<p>La présidence et la coprésidence gèrent le premier compte de l’association et les accès de l’équipe.</p><div class="entry-actions"><button type="button" data-action="entry-create">Créer et vérifier l’association</button><button type="button" class="secondary" data-action="entry-login">Se connecter à un espace existant</button>'+home+'</div></article>';
  }
  const domain = '<label>Nom de domaine de l’association<input name="domain" required placeholder="association.fr" autocapitalize="none" spellcheck="false" value="'+e(state.domain || '')+'"></label>';
  if (state.view === "login") {
    return prefix + '<p>Connectez-vous avec votre compte personnel. Un rôle plus élevé ne peut pas être obtenu en choisissant un autre accès.</p><form data-form="entry-login" class="form">'+domain+
      '<label>Adresse e-mail<input name="email" type="email" autocomplete="username" maxlength="254" value="'+e(state.email || '')+'" required></label>'+
      '<label>Mot de passe<input name="password" type="password" autocomplete="current-password" required></label><button>Se connecter</button></form>'+
      '<div class="entry-actions"><button type="button" class="secondary" data-action="entry-accept">J’ai un code d’invitation</button>'+
      (state.role !== "presidents" ? '<button type="button" class="secondary" data-action="entry-request">Demander un accès</button>' : '')+
      home+'</div></article>';
  }
  if (state.view === "request") {
    return prefix +
      (state.requestDone ? '<p role="status">Votre demande a été transmise si l’association dispose d’un espace actif. La présidence devra l’approuver et vous remettre un code d’invitation. Aucun accès n’est accordé automatiquement.</p>' :
      '<p>La demande est destinée à la présidence de l’association. Elle ne crée pas de compte sans validation.</p><form data-form="entry-request" class="form">'+domain+
      '<label>Votre adresse e-mail<input name="email" type="email" autocomplete="email" required maxlength="254" value="'+e(state.email || '')+'"></label>'+
      '<label>Présentation (facultative)<textarea name="message" rows="3" maxlength="1000" placeholder="Quelques mots pour les responsables"></textarea></label><button>Envoyer ma demande</button></form>')+
      '<div class="entry-actions"><button type="button" class="secondary" data-action="entry-login">Déjà un compte ? Se connecter</button>'+home+'</div></article>';
  }
  if (state.view === "accept") {
    return prefix+'<p>Le code est fourni par la présidence après validation de votre demande. Le rôle est fixé par le serveur.</p><form data-form="entry-accept" class="form"><label>Code d’invitation<input name="token" required autocomplete="off" maxlength="256"></label><label>Choisir un mot de passe<input name="password" type="password" autocomplete="new-password" minlength="12" required></label><button>Activer mon compte</button></form><div class="entry-actions">'+home+'</div></article>';
  }
  return title;
}
