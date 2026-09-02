# Verger Associations

Suite libre, sobre et *local-first* d’outils numériques destinés aux associations, collectifs, SCOP et SCIC.

> **Statut : version pilote 0.2.** La mini-application Webxdc « Réunions et décisions » couvre désormais le cycle de délibération complet et dispose de tests automatisés. Elle doit encore être validée à plusieurs sur des appareils réels avant d’être présentée comme stable.

## Positionnement

Le projet est édité par **Le Verger du Numérique**.  
L’installation, la personnalisation, la formation et la maintenance pourront être proposées par **Le Potager du Web**.

L’objectif n’est pas de recréer une messagerie, un annuaire d’adhérents ou un réseau social. Le projet assemble des briques libres existantes pour se concentrer sur les usages réellement associatifs.

## Architecture retenue

- **Hitobito ou un back-office associatif** : source officielle pour les membres, rôles, cotisations et données durables.
- **Chatmail / Delta Chat** : conversations, groupes, canaux, fichiers, invitations et notifications.
- **Webxdc** : mini-applications collaboratives fonctionnant dans les discussions, sans compte supplémentaire ni serveur applicatif permanent.
- **Robots Chatmail** : rappels, alertes et synchronisations avec Hitobito ou d’autres services.
- **Site public** : présentation, dons, formulaires externes et informations accessibles sans messagerie.

## Prototype disponible

Le code du premier module se trouve dans [`apps/reunions-decisions`](apps/reunions-decisions/README.md).

La version pilote permet de :

- préparer la réunion et son ordre du jour ;
- faire progresser une proposition de la clarification à la décision ;
- consigner réactions, objections et amendements, puis leur traitement ;
- enregistrer la formulation retenue et une date de révision ;
- attribuer des actions liées aux propositions ;
- archiver sans effacer, puis exporter le relevé en Markdown ou JSON.

Le paquet prêt à envoyer dans Delta Chat est généré dans `dist/reunions-decisions.xdc` avec :

```bash
./scripts/build-xdc.sh
```

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
- la mini-application « Réunions et décisions » ;
- à terme, un robot de rappels relié à Hitobito ;
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

- Chatmail n’est pas un *backend* applicatif classique : il transporte les messages et les mises à jour Webxdc via Delta Chat.
- Webxdc n’accède pas directement à Internet : les intégrations externes passent par un robot ou un lien explicitement ouvert.
- Les données juridiques, comptables et administratives ne doivent pas reposer uniquement sur les conversations.
- Chatmail est un transport éphémère, pas un archivage documentaire permanent.
- L’adoption de Delta Chat par les membres doit être validée en situation réelle.
- Le choix de licence doit être arrêté avant toute ouverture du dépôt ou acceptation de contributions externes.

## Documentation

- [Vision et périmètre](docs/VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Chatmail, Delta Chat et Webxdc](docs/CHATMAIL.md)
- [Cas d’usage](docs/USE-CASES.md)
- [Périmètre du MVP](docs/MVP.md)
- [Modèle de données](docs/DATA-MODEL.md)
- [Modules](docs/MODULES.md)
- [Pilote Aldebaran](docs/PILOT-ALDEBARAN.md)
- [Feuille de route](docs/ROADMAP.md)
- [Questions ouvertes](docs/OPEN-QUESTIONS.md)
- [Sécurité et vie privée](docs/SECURITY-PRIVACY.md)
- [Journal des décisions](docs/DECISIONS.md)
- [Contribuer](CONTRIBUTING.md)

## Références techniques

- [Chatmail](https://chatmail.at/)
- [Delta Chat](https://delta.chat/)
- [Webxdc](https://webxdc.org/)
- [Hitobito](https://hitobito.com/)

## Licence

Le choix de licence est en cours. Le projet vise une publication open source ; aucun fichier de licence ne sera ajouté avant une décision explicite sur le niveau de copyleft souhaité.
