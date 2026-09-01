# Verger Associations

Suite libre, sobre et *local-first* d’outils numériques destinés aux associations, collectifs, SCOP et SCIC.

> **Statut : cadrage initial.** Le dépôt documente l’architecture et les usages déjà établis. Aucun logiciel n’est encore présenté comme fonctionnel.

## Positionnement

Le projet est édité par **Le Verger du Numérique**.  
L’installation, la personnalisation, la formation et la maintenance pourront être proposées par **Le Potager du Web**.

L’objectif n’est pas de recréer une messagerie, un annuaire d’adhérents ou un réseau social. Le projet assemble des briques libres existantes pour se concentrer sur les usages réellement associatifs.

## Architecture retenue

- **Hitobito ou un back-office associatif** : source officielle pour les membres, rôles, cotisations et données durables.
- **Chatmail / Delta Chat** : conversations, groupes, canaux, fichiers, invitations et notifications.
- **Webxdc** : mini-applications collaboratives fonctionnant dans les discussions, sans compte supplémentaire et sans serveur applicatif permanent.
- **Robots Chatmail** : rappels, alertes et synchronisations avec Hitobito ou d’autres services.
- **Site public** : présentation, dons, formulaires externes et informations accessibles sans messagerie.

## Premiers modules envisagés

1. **Décisions** — propositions, clarifications, objections, amendements, décision, responsables et date de révision.
2. **Actions** — tâches, responsables, matériel, échéances et progression.
3. **Réunions** — ordre du jour, disponibilités, décisions et suites.
4. **Événements** — choix de date, inscriptions, rôles et organisation.
5. **Bénévoles** — besoins, disponibilités et répartition.
6. **Accueil** — parcours des nouveaux membres, documents et contacts.
7. **Entraide** — demandes et propositions d’aide.
8. **Consultations** — questionnaires privés auprès des membres.
9. **Signalements** — remontées de problèmes et suivi de résolution.
10. **Alertes** — notifications qualifiables issues d’outils comme `alerts.lepotager.org`.

## Premier pilote envisagé

L’association **Aldebaran**, avec ses 4 à 7 fondateurs, constitue le terrain d’essai prioritaire :

- un groupe Delta Chat ;
- un canal d’annonces ;
- une première mini-application « Réunions et décisions » ;
- un robot de rappels relié à Hitobito ;
- des tests Android et ordinateur.

## Principes

- open source ;
- sobriété numérique ;
- accessibilité ;
- fonctionnement local et hors ligne quand possible ;
- chiffrement de bout en bout ;
- minimum de données ;
- pas de publicité ni de pistage ;
- réversibilité et formats exportables ;
- développement progressif à partir de besoins testés.

## Limites connues

- Webxdc n’accède pas directement à Internet : les intégrations externes passent par un robot ou un lien explicitement ouvert.
- Les données juridiques, comptables et administratives ne doivent pas reposer uniquement sur les conversations.
- Chatmail est un transport éphémère, pas un archivage documentaire permanent.
- L’adoption de Delta Chat par les membres doit être validée en situation réelle.
- Le choix de licence doit être arrêté avant la première publication de code.

## Documentation

- [Vision et périmètre](docs/VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Modules](docs/MODULES.md)
- [Pilote Aldebaran](docs/PILOT-ALDEBARAN.md)
- [Feuille de route](docs/ROADMAP.md)
- [Sécurité et vie privée](docs/SECURITY-PRIVACY.md)
- [Contribuer](CONTRIBUTING.md)

## Références techniques

- [Chatmail](https://chatmail.at/)
- [Delta Chat](https://delta.chat/)
- [Webxdc](https://webxdc.org/)
- [Hitobito](https://hitobito.com/)

## Licence

Le choix de licence est en cours. Le projet vise une publication open source ; aucun fichier de licence ne sera ajouté avant une décision explicite sur le niveau de copyleft souhaité.
