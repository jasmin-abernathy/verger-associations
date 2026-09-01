# Chatmail, Delta Chat et Webxdc

## Réponse courte

Chatmail permet de faire beaucoup plus qu’échanger des fichiers Markdown. Il fournit le transport des messages ; Delta Chat fournit l’interface, les groupes et l’identité ; Webxdc permet d’exécuter de vraies mini-applications HTML, CSS et JavaScript dans les conversations.

Chatmail n’est cependant pas une base de données ou un framework applicatif traditionnel. La logique métier reste dans la mini-application ou dans un robot explicite.

## Rôle de chaque composant

| Composant | Ce qu’il apporte | Ce qu’il ne remplace pas |
|---|---|---|
| Relais Chatmail | Acheminement sobre et temporaire des messages | Base documentaire ou back-office durable |
| Delta Chat | Comptes, appareils, contacts, groupes, canaux, fichiers et appels | Logiciel métier propre à une association |
| Webxdc | Mini-apps collaboratives dans une conversation | Service web ayant un accès Internet permanent |
| Robot Delta Chat | Rappels et ponts vers Hitobito ou d’autres API | Participant invisible ou accès illimité aux données |
| Hitobito / back-office | Membres, rôles, cotisations et données officielles | Conversation quotidienne |

## Ce qu’une mini-application peut faire

- afficher une interface adaptée au téléphone et à l’ordinateur ;
- échanger des mises à jour avec les autres membres du chat ;
- fonctionner hors ligne puis transmettre les changements ;
- utiliser l’identité fournie par la messagerie ;
- conserver un état partagé à travers les mises à jour Webxdc ;
- préparer un texte ou un fichier que l’utilisateur choisit de partager ;
- importer des fichiers avec une action explicite de l’utilisateur ;
- exporter un relevé, un fichier JSON, un calendrier ou un autre format ouvert.

Le projet peut donc contenir du HTML, du CSS, du JavaScript, des tests, des scripts de construction et des paquets `.xdc`. Il pourra aussi contenir le code de robots d’intégration.

## Format `.xdc`

Un paquet Webxdc est une archive ZIP portant l’extension `.xdc`.

À la racine :

- `index.html` est obligatoire ;
- `manifest.toml` est recommandé ;
- `icon.png` ou `icon.jpg` est facultatif ;
- les feuilles de style, scripts et autres ressources sont embarqués.

Une application peut être développée dans un navigateur, testée avec plusieurs participants simulés, construite en `.xdc`, puis envoyée dans une conversation Delta Chat.

## État partagé

L’API principale repose sur deux opérations :

- `sendUpdate()` diffuse une modification aux participants ;
- `setUpdateListener()` reçoit et rejoue les modifications connues.

Les mises à jour peuvent être retardées, réordonnées ou exceptionnellement perdues. Une application sérieuse doit donc rendre ses opérations identifiables et idempotentes, et définir une stratégie de fusion des changements concurrents.

Le premier prototype utilise des opérations horodatées logiquement, fusionnées champ par champ. Ce mécanisme est suffisant pour explorer le parcours, mais devra être éprouvé avant un usage sensible.

## Internet et intégrations

Une mini-app Webxdc n’a pas d’accès Internet direct. C’est une protection importante contre le pistage et les fuites de données.

Lorsqu’un module doit lire ou écrire dans Hitobito :

1. l’utilisateur agit dans la mini-app ;
2. la demande est transmise dans la conversation ;
3. un robot explicitement présent la traite ;
4. le robot appelle l’API externe ;
5. il renvoie uniquement le résultat nécessaire.

Le robot doit annoncer sa présence, limiter ses journaux et ne traiter que les conversations prévues.

## Ce que le projet peut coder dès maintenant

- mini-apps Webxdc fonctionnelles ;
- simulateur local pour les tests ;
- production automatique des `.xdc` ;
- tests de synchronisation entre plusieurs participants ;
- exports Markdown, JSON, CSV ou ICS ;
- robots Delta Chat ;
- adaptateurs Hitobito ;
- documentation d’installation d’un relais dédié, si le pilote le justifie.

Il n’est pas nécessaire d’exploiter immédiatement un relais Chatmail privé pour commencer. Le développement et les premiers essais peuvent utiliser le simulateur puis un relais Chatmail existant.

## Références officielles

- [Démarrer avec Webxdc](https://webxdc.org/docs/)
- [Format du conteneur `.xdc`](https://webxdc.org/docs/spec/format.html)
- [API `sendUpdate`](https://webxdc.org/docs/spec/sendUpdate.html)
- [API `setUpdateListener`](https://webxdc.org/docs/spec/setUpdateListener.html)
- [API `sendToChat`](https://webxdc.org/docs/spec/sendToChat.html)
- [Questions sur le stockage](https://webxdc.org/docs/faq/storage.html)
