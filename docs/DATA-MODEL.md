# Modèle de données v0.3

## Principes

- conserver le minimum nécessaire ;
- un modèle commun plutôt qu’un silo par module ;
- identifiants stables ;
- fusion concurrente déléguée à Automerge ;
- archivage logique lorsque l’historique doit être conservé ;
- export dans un format ouvert ;
- données administratives sensibles hors socle par défaut.

## Document racine

```text
organization
members
meetings
  ├── agenda
  └── proposals
       └── contributions
actions
events
volunteerNeeds
consultations
alerts
metadata
```

## Association

`id`, `name`, `description`, `createdAt`, `updatedAt`.

## Membre

`id`, `name`, `role`, `contact`, `archived`, `createdAt`.

Le modèle est volontairement minimal. Cotisations, pièces et informations légales ne sont pas ajoutées tant que leur besoin et leurs droits ne sont pas définis.

## Réunion

`id`, `title`, `date`, `facilitator`, `secretary`, `archiveReference`, `agenda`, `proposals`, `archived`, `createdAt`.

## Proposition

`id`, `title`, `details`, `status`, `decisionMethod`, `decisionText`, `reviewDate`, `contributions`, `archived`, `createdAt`.

Méthodes prévues : `consent`, `majority`, `majorityJudgment`, `board`, `consensus`, `other`.

Le jugement majoritaire n’est pas encore calculé par la PWA : la valeur réserve le contrat métier avec l’urne Mieux Voter.

## Contribution

`id`, `type`, `text`, `author`, `resolved`, `archived`, `createdAt`.

Types : `clarification`, `reaction`, `objection`, `amendment`.

## Action

`id`, `text`, `owner`, `due`, `meetingId`, `proposalId`, `done`, `archived`, `createdAt`.

## Événement

`id`, `title`, `date`, `location`, `participants`, `archived`, `createdAt`.

## Besoin bénévole

`id`, `title`, `slots`, `eventId`, `assignments`, `closed`, `archived`, `createdAt`.

## Convergence

Le prototype v0.2 utilisait des patchs Webxdc horodatés logiquement. La v0.3 remplace ce mécanisme par Automerge CRDT afin de fusionner les historiques concurrents sans maintenir un algorithme de convergence spécifique au projet.

## Export portable

```json
{
  "format": "verger-associations",
  "schemaVersion": 1,
  "exportedAt": "2026-09-27T00:00:00.000Z",
  "data": {}
}
```

Cet export sert à la sauvegarde et à la migration. Les exports lisibles (Markdown, PDF, ICS, CSV) sont des vues métier complémentaires.
