import {
  addAction,
  addAgendaItem,
  addContribution,
  addEvent,
  addMeeting,
  addMember,
  addProposal,
  addVolunteerNeed,
  exportPortableJson,
  recordDecision,
} from "./domain.js";
import { slug } from "./helpers.js";
import { exportMeetingMarkdown, importAnyJson } from "./portability.js";
import {
  STORAGE_KEYS,
  changeDoc,
  currentDoc,
  handle,
  saveSyncSettings,
  syncToken,
  syncUrl,
} from "./repo.js";
import { renderView } from "./views.js";

const panels = [...document.querySelectorAll("[data-panel]")];
const navItems = [...document.querySelectorAll("[data-view]")];
const headerName = document.getElementById("org-name-header");
const connectionState = document.getElementById("connection-state");
const installButton = document.getElementById("install-app");
const accessibleButton = document.getElementById("accessible-mode");
const toast = document.getElementById("toast");
let currentView = "dashboard";
let installPrompt = null;
let toastTimer = null;

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = String(message);
  toast.dataset.error = String(Boolean(isError));
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}

function context() {
  return { syncUrl, syncToken, docUrl: handle.url };
}

function render() {
  const state = currentDoc();
  if (!state) return;
  headerName.textContent = state.organization?.name || "Mon association";
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
  connectionState.dataset.state = syncUrl && online ? "sync" : "offline";
  connectionState.textContent = syncUrl
    ? (online ? "Local + synchro" : "Hors ligne · local")
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

function handleForm(form) {
  const type = form.dataset.form;
  const values = formValues(form);
  const meetingId = form.dataset.meetingId || values.meetingId || "";
  const proposalId = form.dataset.proposalId || values.proposalId || "";

  switch (type) {
    case "member":
      mutate((doc) => addMember(doc, values), "Membre ajouté");
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
    case "event":
      mutate((doc) => addEvent(doc, values), "Événement créé");
      break;
    case "volunteer":
      mutate((doc) => addVolunteerNeed(doc, values), "Besoin bénévole ajouté");
      break;
    case "organization":
      mutate((doc) => {
        doc.organization.name = String(values.name || "").trim().slice(0, 180) || "Mon association";
        doc.organization.description = String(values.description || "").trim().slice(0, 1000);
      }, "Association mise à jour");
      break;
    case "sync":
      saveSyncSettings(values.url, values.token);
      showToast("Réglages enregistrés · recharge de l’application");
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
    changeDoc((draft) => {
      for (const key of Object.keys(draft)) delete draft[key];
      Object.assign(draft, data);
    });
    showToast("Sauvegarde importée");
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
  handleForm(form);
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches?.("[data-toggle-agenda]")) toggleAgenda(target);
  if (target.matches?.("[data-toggle-action]")) toggleAction(target);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "close-volunteer") closeVolunteer(button.dataset.id);
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

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker indisponible", error)));
}
