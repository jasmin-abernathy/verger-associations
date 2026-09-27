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
