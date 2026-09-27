import { DECISION_METHODS } from "./domain.js";

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char]);
}
export function nl(value) { return escapeHtml(value).replace(/\n/g, "<br>"); }
export function formatDate(value) {
  if (!value) return "Date à préciser";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : escapeHtml(value);
}
export function heading(title, text) {
  return `<header class="view-heading"><p class="eyebrow">Le Verger du Numérique · pilote 0.3</p><h1 tabindex="-1">${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p></header>`;
}
export function empty(text) { return `<p class="empty">${escapeHtml(text)}</p>`; }
export function stat(value, label) { return `<div class="stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`; }
export function contributionLabel(type) {
  return ({ clarification: "Clarification", reaction: "Réaction", objection: "Objection", amendment: "Amendement" })[type] || "Contribution";
}
export function methodOptions(selected) {
  return Object.entries(DECISION_METHODS).map(([value, label]) => `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}
export function statusOptions(selected) {
  return [["draft","Brouillon"],["clarification","À clarifier"],["discussion","En discussion"],["objection","Objection à traiter"],["amendment","À amender"],["accepted","Adoptée"],["rejected","Rejetée"]]
    .map(([value,label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}
export function slug(value) {
  return String(value || "association").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "association";
}
