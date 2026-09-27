# Architecture v0.3 — Verger Associations autonome

## Décision de pivot

Verger Associations devient une application associative autonome et local-first.

Les briques précédemment obligatoires — Delta Chat, Chatmail, Webxdc et Hitobito — ne constituent plus le socle utilisateur. Elles peuvent rester des connecteurs ou des pistes d’interopérabilité si un besoin réel le justifie.

Le prototype Webxdc est conservé pour son modèle métier et ses enseignements, pas comme architecture cible.

## Principe directeur

Une association doit pouvoir ouvrir **une seule application**, y retrouver ses informations et continuer à travailler même si le serveur de synchronisation est indisponible.

```text
PWA Verger Associations
        │
        ├── modèle métier commun
        │   ├── membres
        │   ├── réunions
        │   ├── décisions
        │   ├── actions
        │   ├── événements
        │   └── bénévolat
        │
        ├── Automerge Repo
        │   └── IndexedDB local
        │
        ├── BroadcastChannel
        │   └── synchro locale entre onglets
        │
        └── WebSocket facultatif
            └── Verger Sync auto-hébergé
```

## Briques réutilisées

### Automerge / Automerge Repo

Version cible du pilote : **2.5.6 stable**, figée dans les `package.json` afin de rendre le premier build reproductible.

Licence MIT.

Responsabilités :

- document collaboratif local-first ;
- fusion déterministe des modifications concurrentes ;
- stockage navigateur IndexedDB ;
- transport WebSocket facultatif ;
- possibilité d’ajouter d’autres transports plus tard.

Cette brique remplace le mécanisme de fusion maison du prototype Webxdc.

### Paheko

Paheko reste une **référence métier et un connecteur potentiel**, pas une dépendance du client.

À étudier pour :

- imports/exports de membres ;
- catégories et cotisations ;
- logique associative française ;
- pont comptable éventuel.

### Loomio

Référence UX/métier pour les discussions, propositions, décisions et historique. Pas de dépendance technique prévue.

### Mieux Voter

L’urne Android reste un composant externe spécialisé pour le jugement majoritaire hors ligne. Verger prépare le scrutin et importe un résultat agrégé ; les bulletins individuels ne doivent pas remonter dans Verger par défaut.

## Serveur de synchronisation

`services/verger-sync` est dérivé conceptuellement du serveur de référence Automerge, mais ajoute une barrière d’accès par jeton au WebSocket.

Pour le pilote :

- secret distinct par déploiement ;
- aucun document proposé spontanément (`sharePolicy: false`) ;
- port non exposé directement : reverse proxy TLS obligatoire en production ;
- aucun log volontaire du jeton.

Avant mutualisation : authentification individuelle, organisations, invitations, révocation et quotas sont obligatoires.

## Données

Le premier schéma partagé est volontairement simple :

- `organization` ;
- `members` ;
- `meetings` ;
- `actions` ;
- `events` ;
- `volunteerNeeds` ;
- `consultations` ;
- `alerts`.

Une réunion contient son ordre du jour et ses propositions. Une proposition contient ses contributions et sa décision. Les actions peuvent pointer vers une réunion et une proposition.

Le but est d’éviter dix silos de données et de conserver les relations métier.

## Hors connexion

Le serveur n’est pas la source unique de vérité. Le document Automerge présent dans IndexedDB reste utilisable sans réseau. Les changements sont propagés lorsque le transport redevient disponible.

## Export et réversibilité

La PWA exporte un JSON portable avec :

- identifiant de format ;
- version de schéma ;
- date d’export ;
- document métier.

Un relevé Markdown de réunion existe. PDF et ICS restent à étudier. L'import JSON ouvre désormais un nouveau document pour éviter d'écraser l'espace partagé.

## Sécurité et données sensibles

Le v0.3 ne doit pas devenir par défaut un coffre de pièces d’identité, données bancaires ou justificatifs.

L’annuaire membre est volontairement minimal. Les données plus sensibles nécessitent une analyse spécifique, des droits plus fins et une stratégie de chiffrement/archivage appropriée.
