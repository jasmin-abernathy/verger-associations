import path from "node:path";
import { openAuthorityDatabase } from "./authority-db.js";
import { createAccount, createOrganization } from "./consultations-service.js";

const dataDir = process.env.DATA_DIR || ".verger-sync";
const dbPath = process.env.VERGER_AUTH_DB || path.join(dataDir, "authority.sqlite");
const [email, password, organizationName = "Mon association", organizationId = "default"] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npm run bootstrap-admin -- email mot-de-passe [nom-association] [id-association]");
  process.exit(1);
}

const db = openAuthorityDatabase(dbPath);
const existing = db.prepare("SELECT id FROM organizations WHERE id = ?").get(organizationId);
if (!existing) createOrganization(db, { id: organizationId, name: organizationName });

const account = createAccount(db, {
  organizationId,
  email,
  password,
  role: "administrator",
});

console.log(JSON.stringify({
  ok: true,
  organizationId,
  account: {
    id: account.id,
    email: account.email,
    role: account.role,
  },
}, null, 2));
db.close();
