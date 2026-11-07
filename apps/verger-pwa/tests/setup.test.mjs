import assert from "node:assert/strict";
import { test } from "node:test";
import { createInitialState } from "../src/domain.js";
import { DEFAULT_MODULES, renderSetupWizard } from "../src/setup.js";
import { renderView } from "../src/views.js";
import { renderRoleEntry, ENTRY_ROLES, roleForAccount } from "../src/role-entry.js";
import { associationPalette, contrastRatio } from "../src/theme-palette.js";

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

test("deux méthodes de validation disponibles avec le même défi", () => {
  const challenge = {
    domain: "asso.fr", dnsName: "_verger.asso.fr",
    dnsValue: "verger-domain-verification=test-code",
    fileName: "verger-verification.txt",
    fileUrl: "https://asso.fr/verger-verification.txt",
    fileContents: "verger-domain-verification=test-code\n",
    expiresAt: "2026-11-06T22:00:00Z",
  };
  const original = renderSetupWizard({ ...s, step: 3, method: "dns", challenge }, "");
  assert.match(original, /data-action="setup-method" data-method="dns"/);
  assert.match(original, /data-action="setup-method" data-method="file"/);
  assert.match(original, /TXT/);
  assert.match(original, /Vérifier le DNS et créer mon espace/);
  const alternate = renderSetupWizard({ ...s, step: 3, method: "file", challenge }, "");
  assert.match(alternate, /Télécharger verger-verification\.txt/);
  assert.match(alternate, /https:\/\/asso\.fr\/verger-verification\.txt/);
  assert.match(alternate, /Vérifier le fichier et créer mon espace/);
  assert.doesNotMatch(alternate, /name="password"/);
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

test("accueil : Bénévoles, Bureau / fondateurs puis Présidence / coprésidence, sans privilège implicite", () => {
  assert.deepEqual(ENTRY_ROLES.map(x => x.key), ["volunteer","founders","presidents"]);
  const home = renderRoleEntry({view:"choices"});
  const locations = ["Bénévoles","Bureau / fondateurs","Présidence / coprésidence"].map(label=>home.indexOf(label));
  assert.ok(locations.every(n=>n>0) && locations[0]<locations[1] && locations[1]<locations[2]);
  assert.match(renderRoleEntry({view:"login",role:"volunteer"}), /data-form="entry-login"/);
  assert.match(renderRoleEntry({view:"login",role:"founders"}), /data-action="entry-request"/);
  assert.doesNotMatch(renderRoleEntry({view:"login",role:"presidents"}), /data-action="entry-request"/);
  assert.match(renderRoleEntry({view:"request",role:"volunteer"}), /data-form="entry-request"/);
  assert.match(renderRoleEntry({view:"accept",role:"founders"}), /data-form="entry-accept"/);
  assert.equal(roleForAccount({role:"administrator"}),"presidents");
  assert.equal(roleForAccount({role:"facilitator"}),"founders");
  assert.equal(roleForAccount({role:"member"}),"volunteer");
  assert.equal(roleForAccount({role:"reader"}),"volunteer");
  assert.doesNotMatch(home, /<script/i);
});

test("palette déclinée automatiquement, contraste sur toutes les couleurs de base", () => {
  for (const color of ["#eddd53","#dd668a","#186bd5","#111111","#eeeeee","#315f3a","#684887"]) {
    for (const dark of [false,true]) {
      const p=associationPalette(color,dark);
      for (const key of ["--bg","--surface","--surface-2","--border","--green","--green-strong","--green-soft","--button-text"]) assert.match(p[key],/^#[a-f0-9]{6}$/i);
      assert.ok(contrastRatio(p["--green"],p["--button-text"])>=4.5,color+" button "+dark);
      assert.ok(contrastRatio(p["--green-strong"],p["--surface-2"])>=4.5,color+" link "+dark);
    }
  }
  assert.notEqual(associationPalette("#df647a")["--bg"],associationPalette("#4473c4")["--bg"]);
  assert.notEqual(associationPalette("#df647a")["--surface-2"],associationPalette("#4473c4")["--surface-2"]);
  assert.equal(associationPalette("red")["--bg"],associationPalette("#315f3a")["--bg"]);
});
