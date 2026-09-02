# MVP — Réunions et décisions

## Objectif

Valider qu’un petit groupe associatif peut préparer une réunion, structurer ses propositions, enregistrer ses décisions et répartir les suites sans créer de compte supplémentaire ni installer un outil métier séparé.

## Version 0.2 — pilote testable

La version permet de :

- nommer, dater et attribuer les rôles pratiques d’une réunion ;
- construire un ordre du jour et cocher les points traités ;
- créer et modifier une proposition ;
- suivre les étapes `brouillon`, `clarification`, `discussion`, `objection`, `amendement`, `adoptée` ou `rejetée` ;
- rattacher des clarifications, réactions, objections et amendements à chaque proposition ;
- marquer une contribution comme traitée ;
- conserver la formulation exacte d’une décision et sa date de révision ;
- créer une action, un responsable, une échéance et un lien vers la proposition concernée ;
- archiver et restaurer les éléments sans les effacer de l’historique ;
- partager un relevé Markdown et des données JSON versionnées.

Le module reste neutre sur la méthode de décision. L’adoption d’une proposition demeure un acte humain du groupe.

## Parcours principal

1. Une personne partage le fichier `.xdc` dans le groupe.
2. Elle nomme la réunion, ajoute la date et les rôles utiles.
3. Les participants construisent l’ordre du jour.
4. Ils formulent une proposition et ajoutent leurs contributions.
5. Ils traitent les objections et amendements.
6. Ils enregistrent la formulation exacte de la décision.
7. Ils attribuent les actions et échéances.
8. Une personne partage le relevé validé vers le stockage officiel de l’association.

## Critères d’acceptation technique

- l’application s’ouvre dans Delta Chat sur Android et ordinateur ;
- deux participants voient les mises à jour de l’autre ;
- une mise à jour rejouée ne crée pas de doublon ;
- des opérations concurrentes reçues dans des ordres différents convergent ;
- le contenu reste lisible à 200 % de zoom ;
- toutes les actions importantes sont accessibles au clavier ;
- aucune dépendance externe, télémétrie ou requête réseau n’est nécessaire ;
- l’export contient le cycle complet de décision et les actions ;
- l’état déjà reçu reste consultable hors connexion ;
- les tests automatisés du modèle et du paquet réussissent.

## Critères du pilote Aldebaran

- 4 à 7 personnes rejoignent le groupe ;
- la première prise en main demande moins de 15 minutes ;
- au moins deux réunions réelles sont testées ;
- aucune décision importante n’est considérée comme perdue ;
- les participants savent où se trouve la version officielle du relevé ;
- une majorité souhaite continuer l’essai.

## Hors périmètre

- vote secret et garantie d’anonymat ;
- signature électronique ;
- édition riche du procès-verbal ;
- synchronisation Hitobito ;
- pièces jointes ;
- plusieurs réunions archivées dans la même instance ;
- gestion complète des droits ;
- méthode de gouvernance imposée.

## Définition de « terminé »

Le MVP n’est pas terminé lorsque le code compile. Il l’est lorsque le parcours principal a été utilisé lors de réunions réelles, que les exports sont compris et qu’une procédure claire de conservation officielle existe.
