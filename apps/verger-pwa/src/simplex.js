// Invitation links stay local to this document on this device, outside Automerge exports.
export function normalizeSimplexLink(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.length > 16384 || /[\s\u0000-\u001f\u007f]/.test(raw)) throw new Error('Collez un lien d’invitation SimpleX valide.');
  let url;
  try { url = new URL(raw); } catch { throw new Error('Lien SimpleX invalide.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'simplex.chat' || url.port || url.username || url.password ||
      !/^\/(contact|invitation|a|c|g|i)(\/|$)/.test(url.pathname) || (!url.hash && !url.search)) {
    throw new Error('Utilisez le lien HTTPS d’invitation copié depuis SimpleX (https://simplex.chat/…).');
  }
  return url.href;
}

const key = documentUrl => `verger-simplex-link-v1:${documentUrl}`;
export function readSimplexLink(storage, documentUrl) {
  try { return normalizeSimplexLink(storage.getItem(key(documentUrl))); } catch { return ''; }
}
export function saveSimplexLink(storage, documentUrl, value) {
  const link = normalizeSimplexLink(value);
  if (link) storage.setItem(key(documentUrl), link);
  else storage.removeItem(key(documentUrl));
  return link;
}
