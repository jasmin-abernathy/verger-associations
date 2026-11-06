import { escapeHtml as e } from "./helpers.js";

export const MODULES = Object.freeze([
  ["members", "Annuaire des membres"],
  ["welcome", "Accueil des nouveaux"],
  ["meetings", "Réunions"],
  ["decisions", "Décisions"],
  ["actions", "Actions"],
  ["events", "Événements"],
  ["volunteers", "Bénévolat"],
  ["help", "Entraide"],
  ["ideas", "Boîte à idées"],
  ["resources", "Ressources"],
  ["consultations", "Consultations"],
  ["chat", "Messagerie privée"],
]);
export const DEFAULT_MODULES = Object.freeze(MODULES.map(([id]) => id));

export function renderSetupWizard(s, apiUrl) {
  const progress = `<ol class="setup-progress">${["Association", "Modules", "Responsable", "Vérification"].map((t, i) => `<li class="${s.step === i ? "active" : ""}">${e(t)}</li>`).join("")}</ol>`;
  const intro = `<div class="setup-header"><p class="eyebrow">Première installation</p><h1>Bienvenue sur Verger Associations 🌱</h1><p>Créez votre espace sans installer d'autre outil. La vérification du domaine est réalisée par le serveur.</p></div>${progress}`;
  const actionRow = `<div class="button-row"><button type="button" class="secondary" data-action="setup-explore">Explorer en local</button>${s.step > 0 ? '<button type="button" class="secondary" data-action="setup-back">Retour</button>' : ""}</div>`;
  if (s.step === 0) return `${intro}<article class="card setup-card"><h2>Votre association</h2>
    <form data-form="setup-identity" class="form">
      <label>Nom de l'association<input name="name" required maxlength="180" value="${e(s.name)}"></label>
      <label>Description (facultative)<textarea name="description" rows="3" maxlength="1000">${e(s.description)}</textarea></label>
      <button>Continuer</button></form>${actionRow}</article>`;
  if (s.step === 1) return `${intro}<article class="card setup-card"><h2>Choisissez votre interface</h2>
    <p class="muted">Vous pourrez modifier les modules par la suite. L'administration est réservée aux comptes habilités.</p>
    <form data-form="setup-features" class="form">
      <label>Couleur principale<input name="themeColor" type="color" value="${e(s.themeColor)}"></label>
      <label>Logo (PNG, JPEG ou WebP)<input name="logo" type="file" accept="image/png,image/jpeg,image/webp"></label>
      ${s.logoDataUrl ? `<img class="setup-logo-preview" src="${e(s.logoDataUrl)}" alt="Aperçu du logo de l'association">` : ""}
      <fieldset class="setup-modules"><legend>Modules visibles</legend>${MODULES.map(([id,label])=>`<label class="module-choice"><input type="checkbox" name="module" value="${e(id)}" ${s.modules.includes(id)?"checked":""}><span>${e(label)}</span></label>`).join("")}</fieldset>
      <button>Continuer</button></form>${actionRow}</article>`;
  if (s.step === 2) return `${intro}<article class="card setup-card"><h2>Domaine et compte responsable</h2>
    <p>Le DNS prouve le contrôle technique du domaine, pas la qualité juridique de représentant de l'association.</p>
    <form data-form="setup-owner" class="form">
      <label>Nom de domaine<input name="domain" required placeholder="association.fr" autocapitalize="none" spellcheck="false" value="${e(s.domain)}"></label>
      <label>E-mail du responsable<input name="email" type="email" required autocomplete="email" maxlength="254" value="${e(s.email)}"></label>
      <label>Mot de passe (12 caractères minimum)<input name="password" type="password" required minlength="12" autocomplete="new-password"></label>
      ${!apiUrl ? '<details><summary>Adresse du serveur Verger (prototype)</summary><label>URL du serveur<input name="apiUrl" type="url" placeholder="https://serveur.fr/api/v1"></label></details>' : `<p class="muted">Serveur : ${e(apiUrl)}</p>`}
      <button>Obtenir mon code de vérification</button></form>${actionRow}</article>`;
  const challenge = s.challenge;
  return `${intro}<article class="card setup-card"><h2>Vérifier ${e(challenge?.domain || s.domain)}</h2>
    <p>Dans la zone DNS de votre domaine, ajoutez cet enregistrement. Aucun accès à votre hébergement n'est nécessaire.</p>
    <dl class="dns-details"><dt>Type</dt><dd>TXT</dd><dt>Nom</dt><dd><code>${e(challenge?.dnsName || "")}</code></dd><dt>Valeur</dt><dd><code>${e(challenge?.dnsValue || "")}</code></dd></dl>
    <button type="button" class="secondary" data-action="setup-copy-dns">Copier la valeur TXT</button>
    <p class="muted">Code valable jusqu'au ${challenge?.expiresAt ? e(new Date(challenge.expiresAt).toLocaleString("fr-FR")) : "—"}. Le DNS peut mettre du temps à se propager.</p>
    <form data-form="setup-verify" class="form"><button>Vérifier le domaine et créer mon espace</button></form>
    <p class="warning">La synchronisation sécurisée entre plusieurs téléphones reste à provisionner séparément dans ce prototype.</p>
    ${actionRow}</article>`;
}
