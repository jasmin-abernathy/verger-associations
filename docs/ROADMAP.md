# Feuille de route

## Avancement global vers un premier pilote autonome : 50 %

Le pourcentage a été recalibré lors du pivot v0.3 : le prototype Webxdc a validé le métier, mais le produit cible devient désormais une PWA autonome. La baisse apparente ne signifie pas que le travail v0.2 est perdu : son modèle et ses tests servent de référence de migration.

- [x] **0–15 % — Cadrage et validation métier**
  - vision, licence et principes documentés ;
  - premier cycle Réunion → décision → action validé dans le prototype Webxdc ;
  - limites de Delta Chat/Webxdc identifiées.

- [x] **15–30 % — Nouveau socle local-first**
  - [x] choisir Automerge Repo comme CRDT ;
  - [x] créer la PWA autonome ;
  - [x] stockage local IndexedDB ;
  - [x] navigation commune ;
  - [x] export/import portable ;
  - [x] service worker et manifeste PWA ;
  - [x] créer un pair de synchronisation WebSocket facultatif ;
  - [x] ajouter une protection minimale du serveur par jeton.

- [ ] **30–55 % — Parité métier et build reproductible**
  - [x] membres ;
  - [x] réunions et ordre du jour ;
  - [x] propositions et contributions ;
  - [x] décisions et méthode structurée ;
  - [x] actions ;
  - [x] événements simples ;
  - [x] besoins bénévoles simples ;
  - [x] tests du domaine sans dépendance réseau ;
  - [x] installer les dépendances npm et produire le premier build PWA ;
  - [x] vérifier que le build produit et met en cache les ressources JS/CSS/WASM ;
  - [ ] vérifier la réouverture réellement hors ligne dans un navigateur ;
  - [x] tester deux clients Automerge en Node via Verger Sync ;
  - [ ] tester deux onglets puis deux appareils dans de vrais navigateurs ;
  - [x] importer les données utiles d’un export v0.2 ;
  - [x] rétablir l’export Markdown du relevé de réunion dans la PWA ;
  - [x] ajouter édition + archivage/restauration des membres, actions, événements et annonces ;
  - [x] ajouter des consultations nominatives simples ;
  - [ ] tester clavier, zoom 200 % et lecteur d’écran.

- [ ] **55–75 % — Pilote autonome**
  - déployer la PWA sur un hébergement pilote ;
  - déployer Verger Sync derrière TLS ;
  - accompagner 4 à 7 participants ;
  - conduire au moins deux réunions réelles ;
  - tester le travail hors ligne puis la resynchronisation ;
  - recueillir les blocages et demandes.

- [ ] **75–90 % — Sécurité et intégrations**
  - remplacer le jeton partagé par comptes/invitations/révocation ;
  - définir les permissions minimales ;
  - intégrer le résultat agrégé Mieux Voter ;
  - choisir un premier connecteur réel Paheko/Hitobito seulement si le pilote le demande ;
  - sauvegardes serveur et restauration documentées.

- [ ] **90–100 % — Première version réutilisable**
  - corriger le pilote ;
  - stabiliser le schéma et les exports ;
  - ajouter les modules réellement demandés ;
  - publier la documentation d’installation ;
  - préparer l’offre d’accompagnement du Potager du Web.

## Prochaine étape concrète

Construire `apps/verger-pwa` avec ses dépendances Automerge, corriger les éventuels écarts d’API au build, puis exécuter le scénario suivant :

1. créer une association ;
2. ajouter deux membres ;
3. créer une réunion et une proposition ;
4. ajouter une objection depuis un second client ;
5. enregistrer une décision ;
6. créer une action ;
7. couper le réseau sur un client, modifier des données des deux côtés, reconnecter et vérifier la convergence ;
8. exporter puis réimporter une sauvegarde JSON.
