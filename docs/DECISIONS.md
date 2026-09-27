# Journal des décisions

## Décisions établies

- Nom du projet : **Verger Associations**.
- Éditeur visé : **Le Verger du Numérique**.
- Services associés possibles : **Le Potager du Web**.
- Le code du projet est placé sous **GNU AGPL v3, version 3 uniquement (`AGPL-3.0-only`)**.
- Le dépôt peut être développé publiquement sans secret d’exploitation, donnée personnelle ou information confidentielle de pilote.
- Le premier cycle métier prioritaire reste **Réunion → proposition → contribution → décision → action**.
- Les corrections doivent rester traçables et l’export/réversibilité est une exigence du produit.

### Pivot v0.3 — 27 septembre 2026

- Verger Associations devient une **PWA autonome local-first**.
- Delta Chat, Chatmail et Webxdc ne sont plus des dépendances du produit cible.
- Le prototype Webxdc v0.2 est conservé temporairement comme référence et preuve de concept jusqu’à parité.
- Hitobito n’est plus imposé comme source officielle : Paheko, Hitobito ou un autre back-office peuvent devenir des connecteurs facultatifs.
- **Automerge Repo** est retenu pour l’état collaboratif, la fusion concurrente et le stockage local via IndexedDB.
- Le client doit rester utilisable sans serveur de synchronisation.
- Un serveur **Verger Sync** WebSocket auto-hébergé est ajouté comme transport facultatif entre appareils.
- Le serveur de pilote doit refuser les connexions sans jeton ; le jeton partagé n’est pas considéré comme suffisant pour un service multi-tenant.
- La PWA regroupe dans un modèle commun Membres, Réunions, Décisions, Actions, Événements et Bénévolat.
- Accueil, Entraide, Consultations, Signalements et Alertes seront ajoutés uniquement après validation du socle ou besoin pilote.
- Paheko sert de référence métier et de futur connecteur potentiel, pas de dépendance obligatoire.
- Loomio sert de référence de processus décisionnel, pas de dépendance technique.
- Mieux Voter reste l’urne spécialisée envisagée pour le jugement majoritaire ; Verger vise l’import/export de scrutin et de résultat agrégé plutôt que la duplication immédiate du moteur.
- Communication libre reste un projet séparé ; une interopérabilité peut être ajoutée sans fusionner les deux produits.

## Décisions encore à prendre

- mécanisme d’authentification individuelle après le pilote ;
- modèle de permissions et rôles ;
- chiffrement serveur des données au repos et gestion des clés ;
- protocole d’invitation et révocation ;
- premier connecteur administratif réellement demandé ;
- formats métier à ajouter au JSON portable : Markdown, PDF, ICS, CSV ;
- stratégie de migration d’un document Webxdc v0.2 vers le schéma v0.3 ;
- identité graphique finale et nom éventuel de l’instance installée.
