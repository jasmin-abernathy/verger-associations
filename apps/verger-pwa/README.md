# Verger Associations — client local-first web + Android v0.4

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

## Modules ajoutés depuis le socle initial

- Accueil des nouveaux membres ;
- Entraide ;
- Consultations vérifiées à choix unique via l’autorité serveur ;
- contrat d’interopérabilité du jugement majoritaire.

Les Signalements et Alertes restent à cadrer.

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

## Sauvegarde et restauration

L’export JSON portable contient l’état métier courant et sa version de schéma. Il **ne contient pas l’historique CRDT Automerge**.

Lors d’un import, Verger crée un nouveau document Automerge et bascule vers ce nouvel espace. Le document courant n’est pas écrasé silencieusement.

Procédure recommandée :

1. exporter une sauvegarde JSON ;
2. conserver le fichier dans un emplacement protégé ;
3. importer le fichier depuis Réglages ;
4. vérifier le nom de l’association, les membres, réunions, actions, événements, entraide et consultations ;
5. conserver temporairement l’ancien lien de document tant que la restauration n’a pas été vérifiée.

Une sauvegarde JSON doit être protégée comme les données qu’elle contient.


## Comptes et consultations vérifiées

Les réunions, actions et autres données collaboratives restent local-first dans Automerge.

Les consultations nécessitant de vrais droits utilisent `/api/v1` :

- comptes créés sur invitation ;
- rôles fixes administrateur / animateur / membre / lecteur ;
- 2 à 8 réponses proposées par le créateur ;
- aucun champ de nom au moment de répondre ;
- une réponse par compte, modifiable avant clôture ;
- seul le compte créateur peut clôturer ;
- résultats agrégés après clôture ;
- page publique facultative sans identité individuelle.

En développement, Vite redirige `/api` vers `http://localhost:3030`.

Les anciennes consultations stockées dans Automerge ne sont plus des votes actifs : elles restent visibles comme archives expérimentales non vérifiées.


## Android / Capacitor

Le même frontend peut maintenant être empaqueté comme application Android avec Capacitor 8.5.2.

Après avoir récupéré ce changement, le `package-lock.json` existant ne contient pas encore les dépendances Capacitor. Une première installation doit donc être faite avec :

```bash
npm install
```

Puis :

```bash
npm run android:init
npm run android:apk:debug
```

Le dossier Android généré doit ensuite être versionné ; seuls ses artefacts locaux de build sont ignorés.

Configuration :
- `capacitor.config.json` ;
- `.env.example` pour des URLs embarquées au build ;
- Réglages de l’application pour saisir/modifier API, WSS et URL publique.

Voir `../../docs/ANDROID.md`.
