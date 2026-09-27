# Verger Associations

Suite libre, sobre et **local-first** d’outils numériques destinés aux associations, collectifs, SCOP et SCIC.

> **Statut : pivot v0.3 en cours.** Verger Associations devient une PWA autonome : une seule application pour les membres, réunions, décisions, actions, événements et bénévolat. Le prototype Webxdc v0.2 reste conservé comme référence jusqu’à parité fonctionnelle et validation du nouveau client.

## Positionnement

Le projet est édité par **Le Verger du Numérique**. L’installation, la personnalisation, la formation et la maintenance pourront être proposées par **Le Potager du Web**.

L’objectif est qu’une association puisse utiliser **une seule application**, y compris hors connexion, sans être obligée d’adopter un autre outil de messagerie ou de gestion pour accéder aux fonctions principales.

## Architecture cible v0.3

- **PWA Verger Associations** : interface unique installable depuis le navigateur ;
- **Automerge Repo** : document collaboratif et résolution des modifications concurrentes ;
- **IndexedDB** : stockage local sur l’appareil ;
- **BroadcastChannel** : synchronisation locale entre onglets ;
- **Verger Sync** : serveur WebSocket auto-hébergé et facultatif pour la synchronisation entre appareils ;
- **exports portables** : réversibilité hors du serveur ;
- **connecteurs facultatifs** : Paheko, Hitobito, Communication libre ou d’autres services uniquement si un besoin réel le justifie.

Voir [`docs/ARCHITECTURE-V03.md`](docs/ARCHITECTURE-V03.md).

## Nouveau client autonome

Le code se trouve dans [`apps/verger-pwa`](apps/verger-pwa/README.md).

Le socle v0.3 contient déjà :

- Membres ;
- Réunions ;
- ordre du jour ;
- propositions et contributions ;
- décisions et méthode de décision ;
- Actions ;
- Événements ;
- besoins de bénévolat ;
- export/import JSON portable ;
- mode accessible ;
- service worker et manifeste PWA ;
- stockage Automerge/IndexedDB ;
- synchronisation WebSocket facultative.

Les modules Accueil, Entraide, Consultations, Signalements et Alertes restent à développer après validation du socle.

## Serveur de synchronisation

[`services/verger-sync`](services/verger-sync/README.md) fournit le pair Automerge auto-hébergé du pilote.

Il ajoute une barrière par jeton au serveur de référence Automerge, mais **ce jeton partagé n’est pas encore une authentification multi-utilisateur complète**. Le serveur ne doit pas être mutualisé entre associations non liées avant ajout des comptes, invitations et révocations.

## Prototype Webxdc historique

[`apps/reunions-decisions`](apps/reunions-decisions/README.md) reste disponible et testable. Il a validé le modèle métier du premier module : ordre du jour, propositions, objections, amendements, décisions, actions, archivage et exports.

Il n’est plus l’architecture cible et ne doit pas recevoir de nouvelles fonctions qui peuvent être développées directement dans la PWA v0.3.

## Briques libres étudiées

- **Automerge / Automerge Repo** — socle local-first et CRDT, licence MIT ;
- **Paheko** — référence métier associative française et futur connecteur potentiel, AGPL-3.0 ;
- **Loomio** — référence pour les processus de décision collective, AGPL-3.0 ;
- **Mieux Voter** — urne hors ligne au jugement majoritaire, GPL-3.0.

Le but n’est pas d’empiler quatre applications visibles par l’utilisateur : Verger réutilise les briques pertinentes derrière une interface cohérente.

## Frontière avec Communication libre

[Communication libre](https://github.com/jasmin-abernathy/communication-libre) reste un projet distinct consacré à la communication. Verger Associations ne recrée pas sa messagerie ou sa visioconférence.

Une intégration future peut ajouter des liens, notifications ou exports entre les deux, sans rendre Communication libre obligatoire pour faire fonctionner Verger Associations.

## Principes

- open source ;
- sobriété numérique ;
- accessibilité ;
- fonctionnement local et hors ligne ;
- minimum de données ;
- pas de publicité ni de pistage ;
- réversibilité et formats exportables ;
- auto-hébergement possible ;
- composants externes facultatifs plutôt que dépendances utilisateur imposées ;
- développement progressif à partir de besoins testés.

## Documentation

- [Architecture v0.3](docs/ARCHITECTURE-V03.md)
- [Migration du prototype](docs/MIGRATION-V03.md)
- [Architecture historique](docs/ARCHITECTURE.md)
- [Vision et périmètre](docs/VISION.md)
- [MVP](docs/MVP.md)
- [Modèle de données](docs/DATA-MODEL.md)
- [Modules](docs/MODULES.md)
- [Feuille de route](docs/ROADMAP.md)
- [Questions ouvertes](docs/OPEN-QUESTIONS.md)
- [Sécurité et vie privée](docs/SECURITY-PRIVACY.md)
- [Journal des décisions](docs/DECISIONS.md)

## Licence

Verger Associations est distribué sous **GNU Affero General Public License v3.0 only (`AGPL-3.0-only`)**. Les dépendances conservent leurs propres licences compatibles.

Les signalements de sécurité doivent suivre `SECURITY.md` et ne pas être publiés d’abord dans une issue publique.
