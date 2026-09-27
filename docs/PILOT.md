# Pilote associatif v0.3

## Contexte

Le premier pilote cible désormais la PWA autonome Verger Associations. Aucun compte Delta Chat, Chatmail ou Hitobito n’est requis pour tester les fonctions principales.

## Objectifs

- vérifier que l’ouverture ou l’installation de la PWA est compréhensible ;
- tester Android et ordinateur ;
- vérifier le fonctionnement hors ligne ;
- vérifier la resynchronisation Automerge ;
- tester Réunions, Décisions, Actions, Événements et Bénévolat ;
- mesurer le besoin réel de connecteurs administratifs ;
- identifier les difficultés d’accompagnement.

## Configuration minimale

- une URL HTTPS de la PWA ;
- un document d’association ;
- 4 à 7 participants ;
- un serveur Verger Sync privé pour les tests multi-appareils ;
- aucune donnée administrative sensible au départ.

## Scénarios de test

1. ouvrir ou installer la PWA ;
2. ajouter deux membres ;
3. préparer une réunion ;
4. ajouter une proposition et une objection ;
5. enregistrer méthode et décision ;
6. créer une action liée ;
7. créer un événement et un besoin bénévole ;
8. couper le réseau sur un appareil et continuer à travailler ;
9. reconnecter et vérifier la convergence ;
10. exporter une sauvegarde puis la réimporter dans un environnement de test.

## Critères de réussite provisoires

- installation sans intervention technique lourde ;
- prise en main en moins de 15 minutes ;
- usage effectif par la majorité du groupe ;
- aucune décision importante perdue ;
- resynchronisation comprise et fiable ;
- export compréhensible ;
- demande explicite de poursuivre.

## Ce que le pilote ne doit pas faire

- stocker des pièces d’identité ou secrets ;
- servir plusieurs associations non liées avec le même jeton ;
- remplacer immédiatement la comptabilité ou les archives juridiques ;
- imposer une migration définitive ;
- développer tous les modules avant validation du socle.
