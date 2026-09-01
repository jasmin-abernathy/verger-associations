# MVP — Réunions et décisions

## Objectif

Valider qu’un petit groupe associatif peut préparer une réunion, structurer ses propositions, enregistrer ses décisions et répartir les suites sans créer de compte supplémentaire ni installer un outil métier séparé.

## Version 0.1 — prototype technique

La première version doit permettre de :

- nommer et dater une réunion ;
- ajouter des points à l’ordre du jour ;
- cocher les points traités ;
- créer une proposition avec un contexte court ;
- faire passer une proposition par les états `brouillon`, `discussion`, `objection`, `adoptée` ou `rejetée` ;
- créer une action, un responsable et une échéance ;
- marquer une action comme terminée ;
- partager un relevé Markdown ;
- partager les données structurées en JSON.

## Parcours principal

1. Une personne partage le fichier `.xdc` dans le groupe.
2. Elle nomme la réunion et ajoute une date.
3. Les participants construisent l’ordre du jour.
4. Ils ajoutent et qualifient les propositions.
5. Ils enregistrent les actions décidées.
6. Une personne génère le relevé.
7. Le relevé validé est transféré vers le stockage officiel de l’association.

## Critères d’acceptation du prototype

- l’application s’ouvre dans Delta Chat sur Android et ordinateur ;
- deux participants voient les mises à jour de l’autre ;
- une mise à jour rejouée ne crée pas de doublon ;
- le contenu reste lisible à 200 % de zoom ;
- toutes les actions importantes sont accessibles au clavier ;
- aucune dépendance externe ni requête réseau n’est nécessaire ;
- l’export contient la date, l’ordre du jour, les propositions et les actions ;
- une perte de réseau n’empêche pas de consulter l’état déjà reçu.

## Critères du pilote Aldebaran

- 4 à 7 personnes rejoignent le groupe ;
- la première prise en main demande moins de 15 minutes ;
- au moins deux réunions réelles sont testées ;
- aucune décision importante n’est considérée comme perdue ;
- les participants savent où se trouve la version officielle du relevé ;
- une majorité souhaite continuer l’essai.

## Hors périmètre de la version 0.1

- vote secret ;
- garantie d’anonymat ;
- signature électronique ;
- édition riche du procès-verbal ;
- synchronisation Hitobito ;
- pièces jointes ;
- plusieurs réunions archivées dans la même instance ;
- gestion complète des droits ;
- méthode de gouvernance imposée.

## Risques à tester

- changements concurrents sur le même champ ;
- compréhension des statuts d’une proposition ;
- confusion entre relevé de travail et procès-verbal officiel ;
- difficulté à retrouver la mini-app dans une conversation active ;
- volume des mises à jour et durée de conservation ;
- accessibilité réelle des contrôles dans les clients Delta Chat.

## Définition de « terminé »

Le MVP n’est pas terminé lorsque le code compile. Il l’est lorsque le parcours principal a été utilisé lors de réunions réelles, que les exports sont compris et qu’une procédure claire de conservation officielle existe.
