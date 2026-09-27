# Verger Associations — PWA local-first v0.3

Cette application devient le **client principal** de Verger Associations. Le prototype Webxdc `apps/reunions-decisions` reste conservé comme référence métier et comme preuve de concept, mais Delta Chat/Webxdc n’est plus une dépendance du produit cible.

## Ce qui fonctionne dans le socle v0.3

- une seule PWA installable ;
- stockage local IndexedDB via Automerge Repo ;
- fusion CRDT Automerge pour les modifications concurrentes ;
- fonctionnement sans serveur après chargement ;
- synchronisation entre onglets du même navigateur via BroadcastChannel ;
- synchronisation WebSocket facultative vers `services/verger-sync` ;
- Membres ;
- Réunions et ordre du jour ;
- propositions, contributions et décisions ;
- méthodes de décision structurées ;
- Actions liées ou indépendantes ;
- Événements ;
- besoins de bénévolat ;
- export/import JSON portable, y compris migration d’un export Webxdc v0.2 ;
- export Markdown d’un relevé de réunion ;
- mode accessible renforcé ;
- service worker et manifeste PWA.

## Modules encore au stade d’emplacement

- Accueil des nouveaux membres ;
- Entraide ;
- Consultations ;
- Signalements ;
- Alertes ;
- import du résultat agrégé de l’urne Mieux Voter.

## Développement

Node.js 22.13+ est requis.

```bash
cd apps/verger-pwa
npm install
npm test
npm run dev
```

Construction :

```bash
npm run build
```

Le build Vite embarque les dépendances Automerge dans les fichiers statiques produits. L’application publiée ne dépend donc pas d’un CDN JavaScript.

## Première ouverture

Sans URL de document dans le hash, l’application crée automatiquement un document Automerge et conserve son URL dans le stockage local.

L’URL ressemble à :

```text
https://association.exemple.fr/#automerge:...
```

L’identifiant Automerge doit être traité comme une information privée. Pour synchroniser le même document sur plusieurs appareils, un serveur Verger Sync doit être configuré ou un autre transport Automerge devra être ajouté.

## Synchronisation

La PWA fonctionne sans serveur. Dans Réglages, on peut ajouter :

- une URL `wss://.../sync` ;
- le jeton du déploiement Verger Sync.

Après sauvegarde, recharger la PWA.

Le jeton actuel est volontairement une étape de pilote. Une authentification individuelle et des invitations révocables sont nécessaires avant un service mutualisé.

## Tests réalisés sans dépendances npm

Le module métier pur se teste sans Automerge :

```bash
node tests/domain.test.mjs
```

Il couvre la création de membres, réunions, ordre du jour, proposition, objection, décision, action, événement, besoin bénévole et l’export/import portable.
