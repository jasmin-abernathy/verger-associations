import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSimplexLink, readSimplexLink, saveSimplexLink } from '../src/simplex.js';
import { renderView } from '../src/views.js';

test('SimpleX: liens explicites, sans protocole actif ou serveur arbitraire', () => {
  const valid = 'https://simplex.chat/contact#/?v=2-7&smp=example';
  assert.equal(normalizeSimplexLink(valid), valid);
  assert.equal(normalizeSimplexLink(''), '');
  for (const value of ['javascript:alert(1)', 'https://evil.test/g#token', 'https://simplex.chat.evil.test/g#token', 'https://user@simplex.chat/g#token', 'https://simplex.chat:444/g#token', 'https://simplex.chat/', 'https://simplex.chat/not-chat#token', 'https://simplex.chat/g#bad\nlink']) {
    assert.throws(() => normalizeSimplexLink(value));
  }
});
test('SimpleX: conservation par document, suppression et échec de stockage', () => {
  const values = new Map();
  const storage = { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  const link = 'https://simplex.chat/g#group';
  saveSimplexLink(storage, 'document-a', link);
  assert.equal(readSimplexLink(storage, 'document-a'), link);
  assert.equal(readSimplexLink(storage, 'document-b'), '');
  assert.throws(() => saveSimplexLink(storage, 'document-a', 'https://evil.test/g#token'));
  assert.equal(readSimplexLink(storage, 'document-a'), link);
  saveSimplexLink(storage, 'document-a', '');
  assert.equal(readSimplexLink(storage, 'document-a'), '');
  assert.throws(() => saveSimplexLink({ setItem() { throw Error('quota'); } }, 'a', link));
});
test('SimpleX: parcours vide/configuré et confidentialité du lien', () => {
  const empty = renderView('chat', {}, { simplexLink: '' });
  assert.match(empty, /Aucun groupe associé/);
  const html = renderView('chat', {}, { simplexLink: 'https://simplex.chat/g#group' });
  assert.match(html, /referrerpolicy="no-referrer"/);
  assert.ok(html.indexOf('Ouvrir l’invitation') < html.indexOf('Modifier le lien'));
  assert.match(html, /data-form="simplex-settings"/);
});
