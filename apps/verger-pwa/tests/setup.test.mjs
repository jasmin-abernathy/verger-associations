import assert from "node:assert/strict";
import { test } from "node:test";
import { createInitialState } from "../src/domain.js";
import { DEFAULT_MODULES, renderSetupWizard } from "../src/setup.js";
import { renderView } from "../src/views.js";

const s = {
  name: "Les <Amis> du Verger", description: "Accueil & entraide",
  step: 0, modules: [...DEFAULT_MODULES], themeColor: "#315f3a",
  email: "", domain: "", challenge: null, logoDataUrl: "",
};

test("assistant de configuration : nom échappé, modules, contact et code DNS", () => {
  const first = renderSetupWizard(s, "");
  assert.match(first, /data-form="setup-identity"/);
  assert.match(first, /Les &lt;Amis&gt; du Verger/);
  assert.doesNotMatch(first, /value="Les <Amis>/);
  const second = renderSetupWizard({ ...s, step: 1 }, "");
  assert.match(second, /name="module" value="chat"/);
  assert.match(second, /name="logo" type="file"/);
  const owner = renderSetupWizard({ ...s, step: 2 }, "");
  assert.match(owner, /name="domain"/);
  assert.match(owner, /name="password"/);
  const verify = renderSetupWizard({ ...s, step: 3, challenge: {
    domain: "asso.fr", dnsName: "_verger.asso.fr",
    dnsValue: "verger-domain-verification=test-string", expiresAt: "2026-11-06T18:00:00Z",
  } }, "");
  assert.match(verify, /_verger\.asso\.fr/);
  assert.match(verify, /verger-domain-verification=test-string/);
  assert.doesNotMatch(verify, /name="password"/);
});

test("les outils sensibles sont absents des écrans membre et accessibles à l'admin", () => {
  const state = createInitialState("Association pilote");
  const regular = { authority: { account: { role: "member", organizationId: state.organization.id } } };
  const admin = { authority: { account: { role: "administrator", organizationId: state.organization.id } } };
  assert.match(renderView("settings", state, regular), /Accès réservé/);
  assert.doesNotMatch(renderView("settings", state, regular), /Jeton Sync/);
  assert.match(renderView("members", state, regular), /Accès réservé/);
  assert.match(renderView("settings", state, admin), /Jeton Sync/);
  assert.match(renderView("admin", state, admin), /Gérer les membres/);
  assert.match(renderView("admin", state, regular), /Espace responsable/);
  assert.doesNotMatch(renderView("admin", state, regular), /Jeton Sync/);
});
