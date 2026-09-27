# Verger Sync — pilote

Petit pair de synchronisation Automerge pour Verger Associations.

Il ne contient ni interface métier ni base d’adhérents : il conserve et retransmet les documents Automerge que les clients connaissent déjà.

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

## À renforcer avant multi-tenant

- authentification individuelle ;
- invitation/révocation ;
- séparation stricte des organisations ;
- rotation de secrets ;
- quotas et protections anti-abus ;
- sauvegardes chiffrées et procédure de restauration ;
- observabilité minimale sans journaliser les jetons ni les identifiants de documents.
