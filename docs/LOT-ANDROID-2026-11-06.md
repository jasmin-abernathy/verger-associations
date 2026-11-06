# Lot Android — outils associatifs complémentaires (6 novembre 2026)

Les outils métier restent dans Verger Associations (Automerge / PWA embarquée) ; la messagerie appartient au moteur natif SimpleX du même APK expérimental. Cette modification ne crée pas un deuxième client de messagerie.

## Livré dans le client

- Boîte à idées : création, statut de suivi, édition et archivage/restauration.
- Bibliothèque de ressources : notes hors ligne, liens externes HTTP(S) validés, édition et archivage/restauration.
- Événements : participants choisis parmi les membres existants, retrait et export calendrier ICS sur journée entière.
- Bénévolat : affectation de membres connus, plafond de places, clôture et réouverture.
- Import/export JSON : collections intégrées au document portable, initialisation automatique pour les anciens schémas 2.
- Navigation : entrées explicites dans le menu ; modules accessibles aussi dans l’interface embarquée dans l’APK.

## À ne pas surestimer

- Les inscriptions sont **déclaratives** : toute personne pouvant modifier le document Automerge peut agir sur les fiches. Les rôles et révocations ne sont pas encore sécurisés.
- L’export ICS ne contient pas d’heure : les événements ne disposent actuellement que d’une date.
- Les ressources ne stockent pas de fichiers ou de documents sensibles.
- L'intégration SimpleX native ne permet pas encore de lier automatiquement un groupe SimpleX à une association Verger ni de révoquer automatiquement les accès des deux côtés.
- Les réponses à des consultations vérifiées restent sur l’API distincte et nécessitent le réseau.
- Le verrouillage SimpleX ne protège pas automatiquement les données Verger : ne pas diffuser comme version stable.

## Vérifier

- Depuis apps/verger-pwa : npm ci, npm run check puis npm run build.
- Dans l’APK : créer une association, ajouter deux membres, une idée et une ressource, inscrire un membre à un événement et au bénévolat ; exporter/importer ; passer à la discussion SimpleX et revenir.
- Le test sur appareil physique et la synchronisation multi-appareils restent à faire.