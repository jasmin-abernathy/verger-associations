import {
  addAction,
  addAgendaItem,
  addContribution,
  addEvent,
  addHelpPost,
  addMeeting,
  addMember,
  addProposal,
  addVolunteerNeed,
  exportPortableJson,
  recordDecision,
  setArchived,
  setHelpPostClosed,
  setWelcomeStep,
  updateAction,
  updateEvent,
  updateHelpPost,
  updateMember,
} from "./domain.js";
import { slug } from "./helpers.js";
import { exportMeetingMarkdown, importAnyJson } from "./portability.js";
import {
  STORAGE_KEYS,
  changeDoc,
  currentDoc,
  handle,
  openImportedDocument,
  saveSyncSettings,
  syncToken,
  syncUrl,
} from "./repo.js";
import { renderView } from "./views.js";
import {
  getApiBaseUrl,
  getPublicWebUrl,
  nativePlatform,
  platformName,
  saveServerSettings,
} from "./platform.js";
import {
  acceptInvitation as acceptAccountInvitation,
  cancelPoll as cancelAuthorityPoll,
  closePoll as closeAuthorityPoll,
  createInvitation as createAccountInvitation,
  createPoll as createAuthorityPoll,
  getPoll as getAuthorityPoll,
  getPollResults,
  getPublicPollResults,
  getSession,
  listPolls,
  login as loginAccount,
  logout as logoutAccount,
  savePollResponse,
  updatePoll as updateAuthorityPoll,
} from "./consultations-api.js";

const panels = [...document.querySelectorAll("[data-panel]")];
const navItems = [...document.querySelectorAll("[data-view]")];
const headerName = document.getElementById("org-name-header");
const connectionState = document.getElementById("connection-state");
const installButton = document.getElementById("install-app");
const accessibleButton = document.getElementById("accessible-mode");
const toast = document.getElementById("toast");
const query = new URLSearchParams(location.search);
const publicPollId = query.get("publicPoll") || "";
let currentView = publicPollId ? "consultations" : "dashboard";
let installPrompt = null;
let toastTimer = null;
let authorityState = {
  loading: false,
  account: null,
  polls: [],
  selectedPoll: null,
  results: null,
  error: "",
  invitationCode: "",
  inviteToken: "",
  publicMode: Boolean(publicPollId),
  publicResults: null,
};
if (publicPollId) document.documentElement.dataset.publicPoll = "true";
document.documentElement.dataset.native = String(nativePlatform);
document.documentElement.dataset.platform = platformName;
if (nativePlatform) installButton.hidden = true;

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = String(message);
  toast.dataset.error = String(Boolean(isError));
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}

function context() {
  return {
    syncUrl,
    syncToken,
    apiUrl: getApiBaseUrl(),
    publicWebUrl: getPublicWebUrl(),
    docUrl: handle.url,
    nativePlatform,
    platformName,
    authority: authorityState,
  };
}

function render() {
  const state = currentDoc();
  if (!state) return;
  headerName.textContent = authorityState.publicMode ? "Résultats publics" : (state.organization?.name || "Mon association");
  for (const panel of panels) {
    const active = panel.dataset.panel === currentView;
    panel.hidden = !active;
    if (active) panel.innerHTML = renderView(currentView, state, context());
  }
  for (const item of navItems) item.classList.toggle("is-active", item.dataset.view === currentView);
  updateConnectionState();
}

function updateConnectionState() {
  const online = navigator.onLine;
  connectionState.dataset.state = "offline";
  connectionState.textContent = syncUrl
    ? (online ? "Local · serveur configuré (état inconnu)" : "Hors ligne · local")
    : "Local uniquement";
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function mutate(action, successMessage) {
  try {
    changeDoc(action);
    showToast(successMessage);
  } catch (error) {
    console.error(error);
    showToast(error?.message || String(error), true);
  }
}

async function handleForm(form) {
  const type = form.dataset.form;
  const values = formValues(form);
  const meetingId = form.dataset.meetingId || values.meetingId || "";
  const proposalId = form.dataset.proposalId || values.proposalId || "";

  if (["account-login","account-accept-invite","account-invite","poll-create","poll-edit","poll-response","poll-cancel"].includes(type)) {
    await handleAuthorityForm(form, type, values);
    return;
  }

  switch (type) {
    case "member":
      mutate((doc) => addMember(doc, values), "Membre ajouté");
      break;
    case "member-edit":
      mutate((doc) => updateMember(doc, form.dataset.id, values), "Membre mis à jour");
      break;
    case "meeting":
      mutate((doc) => addMeeting(doc, values), "Réunion créée");
      break;
    case "agenda":
      mutate((doc) => addAgendaItem(doc, meetingId, values.text), "Point ajouté");
      break;
    case "proposal":
      mutate((doc) => addProposal(doc, meetingId, values), "Proposition ajoutée");
      break;
    case "contribution":
      mutate((doc) => addContribution(doc, meetingId, proposalId, values), "Contribution ajoutée");
      break;
    case "decision":
      mutate((doc) => recordDecision(doc, meetingId, proposalId, values), "Décision mise à jour");
      break;
    case "action":
      mutate((doc) => addAction(doc, { ...values, meetingId, proposalId }), "Action ajoutée");
      break;
    case "action-edit":
      mutate((doc) => updateAction(doc, form.dataset.id, values), "Action mise à jour");
      break;
    case "event":
      mutate((doc) => addEvent(doc, values), "Événement créé");
      break;
    case "event-edit":
      mutate((doc) => updateEvent(doc, form.dataset.id, values), "Événement mis à jour");
      break;
    case "volunteer":
      mutate((doc) => addVolunteerNeed(doc, values), "Besoin bénévole ajouté");
      break;
    case "help":
      mutate((doc) => addHelpPost(doc, values), "Annonce ajoutée");
      break;
    case "help-edit":
      mutate((doc) => updateHelpPost(doc, form.dataset.id, values), "Annonce mise à jour");
      break;
    case "organization":
      mutate((doc) => {
        doc.organization.name = String(values.name || "").trim().slice(0, 180) || "Mon association";
        doc.organization.description = String(values.description || "").trim().slice(0, 1000);
      }, "Association mise à jour");
      break;
    case "sync":
      saveServerSettings({ apiUrl: values.apiUrl, publicWebUrl: values.publicWebUrl });
      saveSyncSettings(values.url, values.token);
      showToast("Serveur enregistré · recharge de l’application");
      setTimeout(() => location.reload(), 300);
      return;
    default:
      return;
  }

  form.reset();
  render();
}

function toggleAgenda(input) {
  const meetingId = input.dataset.meetingId;
  const itemId = input.dataset.toggleAgenda;
  mutate((doc) => {
    const item = doc.meetings?.[meetingId]?.agenda?.[itemId];
    if (!item) throw new Error("Point d’ordre du jour introuvable");
    item.done = input.checked;
    item.updatedAt = new Date().toISOString();
  }, "Ordre du jour mis à jour");
}

function toggleAction(input) {
  const id = input.dataset.toggleAction;
  mutate((doc) => {
    const action = doc.actions?.[id];
    if (!action) throw new Error("Action introuvable");
    action.done = input.checked;
    action.updatedAt = new Date().toISOString();
  }, "Action mise à jour");
}

function closeVolunteer(id) {
  mutate((doc) => {
    const need = doc.volunteerNeeds?.[id];
    if (!need) throw new Error("Besoin bénévole introuvable");
    need.closed = true;
    need.updatedAt = new Date().toISOString();
  }, "Besoin bénévole clôturé");
}

function toggleWelcome(input) {
  mutate((doc) => setWelcomeStep(doc, input.dataset.memberId, input.dataset.welcomeStep, input.checked), "Accueil mis à jour");
}

function toggleHelp(button) {
  mutate((doc) => setHelpPostClosed(doc, button.dataset.id, button.dataset.closed === "true"), "Annonce mise à jour");
}

function archiveItem(button) {
  mutate(
    (doc) => setArchived(doc, button.dataset.collection, button.dataset.id, button.dataset.archived === "true"),
    button.dataset.archived === "true" ? "Élément archivé" : "Élément restauré",
  );
}

async function loadAuthority() {
  authorityState.loading = true;
  authorityState.error = "";
  render();
  try {
    if (authorityState.publicMode) {
      const data = await getPublicPollResults(publicPollId);
      authorityState.publicResults = data.results;
      return;
    }
    const session = await getSession();
    authorityState.account = session.account || null;
    if (authorityState.account) {
      const data = await listPolls();
      authorityState.polls = data.polls || [];
    } else {
      authorityState.polls = [];
      authorityState.selectedPoll = null;
      authorityState.results = null;
    }
  } catch (error) {
    authorityState.error = authorityMessage(error);
  } finally {
    authorityState.loading = false;
    render();
  }
}

async function refreshAuthorityPolls() {
  if (!authorityState.account) return;
  const data = await listPolls();
  authorityState.polls = data.polls || [];
}

async function openAuthorityPoll(id) {
  authorityState.loading = true;
  authorityState.error = "";
  render();
  try {
    const data = await getAuthorityPoll(id);
    authorityState.selectedPoll = data.poll;
    authorityState.results = null;
    if (data.poll.status === "closed") {
      const resultData = await getPollResults(id);
      authorityState.results = resultData.results;
    }
  } catch (error) {
    authorityState.error = authorityMessage(error);
  } finally {
    authorityState.loading = false;
    render();
  }
}

async function handleAuthorityForm(form, type, values) {
  try {
    authorityState.error = "";
    if (type === "account-login") {
      const data = await loginAccount({
        organizationId: currentDoc().organization.id,
        email: values.email,
        password: values.password,
      });
      authorityState.account = data.account;
      authorityState.invitationCode = "";
      await refreshAuthorityPolls();
      showToast("Connexion réussie");
    }

    if (type === "account-accept-invite") {
      const data = await acceptAccountInvitation({ token: values.token, password: values.password });
      authorityState.account = data.account;
      authorityState.inviteToken = "";
      await refreshAuthorityPolls();
      showToast("Compte créé et connecté");
    }

    if (type === "account-invite") {
      const data = await createAccountInvitation({
        email: values.email,
        role: values.role,
        memberId: values.memberId || null,
      });
      authorityState.invitationCode = data.token;
      showToast("Code d’invitation créé");
    }

    if (type === "poll-create") {
      const options = new FormData(form).getAll("option").map((value) => String(value).trim()).filter(Boolean);
      if (values.resultsVisibility === "public_after_close") {
        const accepted = confirm("Après clôture, les résultats agrégés pourront être publics. Dans un petit groupe, un choix peut parfois être déduit. Continuer ?");
        if (!accepted) return;
      }
      const data = await createAuthorityPoll({
        title: values.title,
        question: values.question,
        options,
        resultsVisibility: values.resultsVisibility,
        deadlineAt: values.deadlineAt ? new Date(values.deadlineAt).toISOString() : null,
      });
      await refreshAuthorityPolls();
      authorityState.selectedPoll = data.poll;
      authorityState.results = null;
      showToast("Consultation ouverte");
    }

    if (type === "poll-edit") {
      const options = new FormData(form).getAll("option").map((value) => String(value).trim()).filter(Boolean);
      if (values.resultsVisibility === "public_after_close" && authorityState.selectedPoll?.resultsVisibility !== "public_after_close") {
        const accepted = confirm("Après clôture, les résultats agrégés pourront être publics. Dans un petit groupe, un choix peut parfois être déduit. Continuer ?");
        if (!accepted) return;
      }
      const data = await updateAuthorityPoll(form.dataset.id, {
        title: values.title,
        question: values.question,
        options,
        resultsVisibility: values.resultsVisibility,
        deadlineAt: values.deadlineAt ? new Date(values.deadlineAt).toISOString() : null,
      });
      authorityState.selectedPoll = data.poll;
      await refreshAuthorityPolls();
      showToast("Consultation mise à jour");
    }

    if (type === "poll-response") {
      await savePollResponse(form.dataset.id, values.optionId);
      showToast("Choix enregistré par le serveur");
      await openAuthorityPoll(form.dataset.id);
      return;
    }

    if (type === "poll-cancel") {
      const accepted = confirm("Annuler administrativement cette consultation ? Cette action est distincte d’une clôture par le créateur.");
      if (!accepted) return;
      await cancelAuthorityPoll(form.dataset.id, values.reason || "");
      authorityState.selectedPoll = null;
      authorityState.results = null;
      await refreshAuthorityPolls();
      showToast("Consultation annulée");
    }

    form.reset();
    render();
  } catch (error) {
    authorityState.error = authorityMessage(error);
    showToast(authorityState.error, true);
    render();
  }
}

function authorityMessage(error) {
  if (error?.status === 404 && error?.code === "http_error") return "Service de comptes et consultations indisponible.";
  if (error instanceof TypeError && /fetch/i.test(error.message || "")) return "Serveur de consultations indisponible. Aucune réponse n’a été comptabilisée.";
  return error?.message || "Opération impossible";
}

async function closeSelectedPoll(id) {
  if (!confirm("Clôturer cette consultation ? Les réponses ne pourront plus être modifiées.")) return;
  try {
    const data = await closeAuthorityPoll(id);
    authorityState.results = data.results;
    await refreshAuthorityPolls();
    const refreshed = await getAuthorityPoll(id);
    authorityState.selectedPoll = refreshed.poll;
    showToast("Consultation clôturée");
    render();
  } catch (error) {
    authorityState.error = authorityMessage(error);
    showToast(authorityState.error, true);
    render();
  }
}

async function logOutAuthority() {
  try { await logoutAccount(); } catch {}
  authorityState.account = null;
  authorityState.polls = [];
  authorityState.selectedPoll = null;
  authorityState.results = null;
  authorityState.invitationCode = "";
  showToast("Déconnecté");
  render();
}

async function copyText(value, success) {
  try {
    await navigator.clipboard.writeText(String(value || ""));
    showToast(success);
  } catch {
    showToast("Impossible d’accéder au presse-papiers", true);
  }
}

function publicPollLink(id) {
  const configured = getPublicWebUrl();
  if (nativePlatform && !configured) return "";
  const base = configured || (location.origin + location.pathname);
  const url = new URL(base);
  url.searchParams.set("publicPoll", id);
  return url.toString();
}

function togglePollCreate() {
  const panel = document.querySelector("[data-poll-create]");
  if (!panel) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden) panel.querySelector("input")?.focus();
}

function editPollOptions(button) {
  const list = button.closest("form")?.querySelector("[data-option-list]");
  if (!list) return;
  const rows = [...list.querySelectorAll("[data-option-row]")];

  if (button.dataset.action === "option-add") {
    if (rows.length >= 8) {
      showToast("Maximum : 8 réponses", true);
      return;
    }
    const row = document.createElement("div");
    row.className = "option-row";
    row.dataset.optionRow = "";
    row.innerHTML = '<span class="option-position"></span><input name="option" maxlength="240" required><div class="option-buttons"><button type="button" class="text-button" data-action="option-up" aria-label="Monter cette réponse">↑</button><button type="button" class="text-button" data-action="option-down" aria-label="Descendre cette réponse">↓</button><button type="button" class="text-button" data-action="option-remove" aria-label="Retirer cette réponse">×</button></div>';
    list.append(row);
    renumberPollOptions(list);
    row.querySelector("input")?.focus();
    return;
  }

  const row = button.closest("[data-option-row]");
  if (!row) return;
  if (button.dataset.action === "option-remove") {
    if (rows.length <= 2) {
      showToast("Une consultation doit proposer au moins 2 réponses", true);
      return;
    }
    row.remove();
  }
  if (button.dataset.action === "option-up" && row.previousElementSibling) {
    list.insertBefore(row, row.previousElementSibling);
  }
  if (button.dataset.action === "option-down" && row.nextElementSibling) {
    list.insertBefore(row.nextElementSibling, row);
  }
  renumberPollOptions(list);
}

function renumberPollOptions(list) {
  [...list.querySelectorAll("[data-option-row]")].forEach((row, index) => {
    row.querySelector(".option-position").textContent = String(index + 1);
    row.querySelector("input").setAttribute("aria-label", `Réponse proposée ${index + 1}`);
  });
}

function downloadMeetingMarkdown(meetingId) {
  try {
    const state = currentDoc();
    const meeting = state.meetings?.[meetingId];
    const text = exportMeetingMarkdown(state, meetingId);
    const file = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(meeting?.title || "reunion")}.md`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Relevé Markdown exporté");
  } catch (error) {
    showToast(error?.message || "Export impossible", true);
  }
}

function downloadExport() {
  const text = exportPortableJson(currentDoc());
  const file = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(currentDoc()?.organization?.name || "verger-associations")}.verger.json`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Sauvegarde JSON exportée");
}

async function importExport(file) {
  try {
    const data = importAnyJson(await file.text());
    openImportedDocument(data).on("change", render);
    showToast("Sauvegarde ouverte dans un nouvel espace");
    render();
  } catch (error) {
    showToast(error?.message || "Import impossible", true);
  }
}

async function copyDocumentLink() {
  try {
    await navigator.clipboard.writeText(location.href);
    showToast("Lien privé copié");
  } catch {
    showToast("Impossible d’accéder au presse-papiers", true);
  }
}

function setAccessible(enabled) {
  document.documentElement.dataset.accessible = String(enabled);
  accessibleButton.setAttribute("aria-pressed", String(enabled));
  accessibleButton.textContent = enabled ? "Version standard" : "Version accessible";
  try { localStorage.setItem(STORAGE_KEYS.accessible, String(enabled)); } catch {}
}

for (const item of navItems) {
  item.addEventListener("click", () => {
    currentView = item.dataset.view;
    render();
    document.getElementById("content")?.focus({ preventScroll: true });
  });
}

document.addEventListener("submit", (event) => {
  const form = event.target.closest?.("form[data-form]");
  if (!form) return;
  event.preventDefault();
  void handleForm(form);
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches?.("[data-toggle-agenda]")) toggleAgenda(target);
  if (target.matches?.("[data-toggle-action]")) toggleAction(target);
  if (target.matches?.("[data-welcome-step]")) toggleWelcome(target);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "close-volunteer") closeVolunteer(button.dataset.id);
  if (action === "toggle-help") toggleHelp(button);
  if (action === "archive-item") archiveItem(button);
  if (action === "toggle-poll-create") togglePollCreate();
  if (["option-add","option-remove","option-up","option-down"].includes(action)) editPollOptions(button);
  if (action === "open-poll") void openAuthorityPoll(button.dataset.id);
  if (action === "poll-back") { authorityState.selectedPoll = null; authorityState.results = null; authorityState.error = ""; render(); }
  if (action === "close-poll") void closeSelectedPoll(button.dataset.id);
  if (action === "account-logout") void logOutAuthority();
  if (action === "copy-invitation-code") void copyText(button.dataset.code, "Code d’invitation copié");
  if (action === "copy-public-poll-link") {
    const link = publicPollLink(button.dataset.id);
    if (!link) showToast("Configurez l’URL publique du Verger dans Réglages.", true);
    else void copyText(link, "Lien public copié");
  }
  if (action === "export-meeting") downloadMeetingMarkdown(button.dataset.id);
  if (action === "copy-link") copyDocumentLink();
  if (action === "export") downloadExport();
  if (action === "import") document.getElementById("import-file")?.click();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "import-file" && event.target.files?.[0]) {
    importExport(event.target.files[0]);
    event.target.value = "";
  }
});

accessibleButton.addEventListener("click", () => setAccessible(document.documentElement.dataset.accessible !== "true"));
try { setAccessible(localStorage.getItem(STORAGE_KEYS.accessible) === "true"); } catch { setAccessible(false); }

window.addEventListener("beforeinstallprompt", (event) => {
  if (nativePlatform) return;
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener("appinstalled", () => { installButton.hidden = true; showToast("Verger Associations installé"); });
window.addEventListener("online", updateConnectionState);
window.addEventListener("offline", updateConnectionState);

handle.on("change", render);
render();
void loadAuthority();

if (!nativePlatform && "serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker indisponible", error)));
}
