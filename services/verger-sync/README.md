# Verger Sync — pilote

Service serveur du pilote Verger Associations.

Il remplit désormais deux rôles séparés :

1. **Verger Sync** conserve et retransmet les documents Automerge connus des clients ;
2. **Autorité comptes/consultations** conserve en SQLite les comptes, rôles, invitations, sessions, choix et clôtures qui ne peuvent pas être sécurisés dans le CRDT partagé.

Il ne devient pas pour autant le back-office métier complet de l’association.

## Sécurité du pilote

Contrairement au serveur de démonstration Automerge, cette variante refuse :

- tout WebSocket qui n’arrive pas sur `/sync` ;
- toute connexion sans `VERGER_SYNC_TOKEN` valide ;
- tout démarrage sans secret d’au moins 24 caractères.

Le jeton est **une protection de déploiement pour le pilote**, pas encore un système complet de comptes, rôles et révocation individuelle. Ne pas mutualiser le même jeton entre plusieurs associations qui ne se font pas confiance.

Le serveur utilise aussi `sharePolicy: false` : il ne révèle pas spontanément les documents qu’il conserve. Le client doit déjà connaître l’URL Automerge du document.

## Lancement

```bash
cp .env.example .env
# modifier VERGER_SYNC_TOKEN
docker compose --env-file .env up -d --build
```

Placer ensuite un reverse proxy HTTPS devant le port local 3030 et utiliser côté PWA :

```text
wss://sync.exemple.fr/sync
```

Le jeton se configure séparément dans Réglages > Synchronisation.

### Attention aux journaux du reverse proxy

L’adaptateur WebSocket Automerge 2.5.6 ne permet pas de fournir un en-tête d’authentification depuis le navigateur. Le pilote transmet donc le jeton en paramètre de l’URL WebSocket (`?token=...`).

Conséquence : une configuration de logs qui enregistre l’URL complète peut enregistrer le secret.

Pour le pilote :
- ne pas journaliser la query string de `/sync` ;
- préférer un format de log basé sur le chemin seul ;
- ne jamais copier une URL WebSocket contenant le jeton dans un ticket ou une capture ;
- utiliser un secret distinct par déploiement et prévoir sa rotation.

Ce mécanisme doit être remplacé par l’architecture d’identité/E2EE avant un service mutualisé.

## À renforcer avant multi-tenant

- authentification individuelle ;
- invitation/révocation ;
- séparation stricte des organisations ;
- rotation de secrets ;
- quotas et protections anti-abus ;
- sauvegardes chiffrées et procédure de restauration ;
- observabilité minimale sans journaliser les jetons ni les identifiants de documents.


## Autorité comptes et consultations

Le contrat est documenté dans `../../docs/CONSULTATIONS-AUTHORITY.md`.

Base par défaut :

```text
/data/authority.sqlite
```

Le serveur expose sous la même origine :

```text
/api/v1/...
```

Pour le pilote, servir idéalement la PWA et cette API derrière le même reverse proxy et le même nom d’hôte.

### Premier administrateur

Le premier compte ne passe pas par invitation. Il se crée explicitement côté serveur.

En installation locale :

```bash
read -s VERGER_BOOTSTRAP_PASSWORD
export VERGER_BOOTSTRAP_PASSWORD
npm run bootstrap-admin -- admin@example.org "Mon association" association-id
unset VERGER_BOOTSTRAP_PASSWORD
```

L’`association-id` doit correspondre à l’identifiant de l’association affiché par la PWA.

Les comptes suivants sont créés depuis une invitation administrateur avec un rôle fixe.

### Docker

Le script de bootstrap est inclus dans l’image. Exemple :

```bash
read -s VERGER_BOOTSTRAP_PASSWORD
export VERGER_BOOTSTRAP_PASSWORD
docker compose exec -e VERGER_BOOTSTRAP_PASSWORD="$VERGER_BOOTSTRAP_PASSWORD" verger-sync \
  npm run bootstrap-admin -- admin@example.org "Mon association" association-id
unset VERGER_BOOTSTRAP_PASSWORD
```

### Limites

- le serveur peut lire les réponses nominatives ;
- récupération de mot de passe non encore définie ;
- pas de vote secret ni d’anonymat ;
- sauvegarde/restauration de `authority.sqlite` à documenter avant pilote réel ;
- le rôle de compte est distinct du rôle métier libre d’une fiche membre.


## Application Android Capacitor

L’APK se connecte directement à ce service et n’utilise pas le proxy de développement Vite.

Origine native par défaut :

```text
https://localhost
```

Configuration serveur :

```bash
VERGER_NATIVE_ORIGINS=https://localhost
```

Les endpoints `/api/v1/native/login` et `/api/v1/native/invitations/accept` renvoient une session Bearer à l’application. Les autres endpoints authentifiés acceptent ensuite :

```http
Authorization: Bearer <session>
```

La PWA web continue d’utiliser son cookie `HttpOnly`.

Voir `../../docs/SERVER-ANDROID.md`.

## Validation HTTP

`npm ci && npm run check` exécute aussi un scénario HTTP sur port local éphémère
avec SQLite en mémoire : sessions web/natives, invitation à usage unique, isolation
des associations, réponse modifiable, clôture créateur, agrégats et déconnexion.
Les réponses privées portent `Cache-Control: no-store`. Les origines Web configurées
reçoivent les en-têtes CORS avec credentials ; les cookies restent SameSite=Lax :
préférer une origine commune, un site tiers pouvant bloquer les cookies.

## Pilote isolé o2switch — ALDEBARAN

Le pilote `app.js` publie uniquement l'API de vérification et les consultations. Il **ne lance pas** le service WebSocket Automerge ni le jeton Sync partagé. L'hébergement Node.js se fait via CloudLinux Passenger, sur une URI dédiée d'un domaine existant (par exemple `https://app.lepotager.org/verger-api/`). Le chemin public est toujours `.../verger-api/api/v1`. La racine de l'application et le fichier SQLite doivent rester **hors de public_html**.

Variables d'environnement obligatoires :

```text
NODE_ENV=production
VERGER_AUTH_DB=/home/<compte>/private/verger-associations-pilot/authority.sqlite
VERGER_REGISTRATION_DOMAINS=asso-aldebaran.fr
VERGER_ALLOWED_ORIGINS=https://app.lepotager.org
VERGER_NATIVE_ORIGINS=https://appassets.androidplatform.net
```

Le serveur refuse de démarrer sans base SQLite privée et sans liste explicite des domaines pilotes. Il rejette l'inscription de tout autre domaine. Les comptes ne sont créés qu'après preuve DNS TXT ou fichier HTTPS, code temporaire valide et saisie du mot de passe du premier responsable. Tester `GET /health`, `POST /api/v1/organizations/verification/start`, les CORS et la non-inscription des domaines non autorisés sur l'URL **publique** avant de donner accès à l'APK.

Pour l'APK Verger avec SimpleX intégré, le serveur peut être saisi à l'étape « Responsable » (`https://app.lepotager.org/verger-api`, sans `/api/v1` : l'application ajoute le suffixe). Les origines natives différentes de l'APK Capacitor classique ne doivent pas être confondues. La synchronisation multi-appareil n'est **pas activée** par ce pilote. Ne pas présenter cette API comme un service multi-associations prêt pour la production.

### Contrôles d'hébergement pour le pilote

Le répertoire de la base et ses fichiers sont privés (permissions répertoire `0700`, base SQLite et journaux `0600` ; umask du processus Node `0077`). Sur o2switch/LiteSpeed, installer dans le `.htaccess` de la **seule URI Passenger `/verger-api`** une redirection permanente `308` vers `https://app.lepotager.org`, sans changer le `.htaccess` parent ni les directives Passenger. Tester un GET non mis en cache et un POST en HTTP : tous deux doivent répondre `308`. Le GET `/verger-api/health` en HTTPS doit répondre `200`. Attention au cache LiteSpeed : un ancien GET `/health` peut être renvoyé avant expiration, raison pour laquelle le test utilise une URL avec paramètre unique.
