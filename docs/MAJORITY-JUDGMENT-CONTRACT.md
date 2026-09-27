# Contrat Verger ↔ urne au jugement majoritaire

Statut : **contrat interne expérimental v1**.

Ce document prépare l’interopérabilité avec l’urne hors ligne de Mieux Voter. Il ne prétend pas encore être un format officiellement accepté par le projet amont.

## Principe

Verger prépare le scrutin et conserve le contexte de décision. L’urne spécialisée réalise le vote et le dépouillement. Verger ne récupère qu’un **résultat agrégé**.

Les bulletins individuels ne doivent pas être enregistrés dans le document Automerge de l’association.

## Verger → urne

Format : `verger-majority-judgment-poll`, `schemaVersion: 1`.

Exemple :

```json
{
  "format": "verger-majority-judgment-poll",
  "schemaVersion": 1,
  "pollId": "mj-poll-...",
  "question": "Quel projet retenir ?",
  "gradingPreset": "quality-5",
  "source": {
    "meetingId": "meeting-...",
    "proposalIds": ["proposal-a", "proposal-b"]
  },
  "choices": [
    { "id": "proposal-a", "label": "Projet A" },
    { "id": "proposal-b", "label": "Projet B" }
  ],
  "createdAt": "2026-09-27T00:00:00.000Z"
}
```

Aucune identité de membre n’est nécessaire.

Le champ `gradingPreset` reste volontairement abstrait tant que l’identifiant public/stable des échelles de l’urne amont n’est pas contractualisé.

## Urne → Verger

Format attendu : `verger-majority-judgment-result`, `schemaVersion: 1`.

Exemple :

```json
{
  "format": "verger-majority-judgment-result",
  "schemaVersion": 1,
  "pollId": "mj-poll-...",
  "closedAt": "2026-09-27T18:00:00.000Z",
  "ballotCount": 12,
  "choices": [
    {
      "id": "proposal-a",
      "rank": 1,
      "majorityGrade": "Bien",
      "distribution": [
        { "grade": "Excellent", "count": 2 },
        { "grade": "Très bien", "count": 4 },
        { "grade": "Bien", "count": 3 },
        { "grade": "Passable", "count": 2 },
        { "grade": "Insuffisant", "count": 1 }
      ]
    }
  ],
  "engine": {
    "name": "Mieux Voter",
    "version": "à renseigner"
  },
  "inputHash": "facultatif"
}
```

## Refus explicite des bulletins individuels

L’importeur Verger rejette un objet contenant des champs tels que :

- `ballots` ;
- `individualBallots` ;
- `individualVotes` ;
- `votes`.

Le nombre agrégé `ballotCount` reste autorisé.

## Vérifications avant import

Lorsque le scrutin préparé est disponible, Verger vérifie :

- le même `pollId` ;
- le même ensemble d’identifiants de propositions ;
- un rang entier positif ;
- une mention majoritaire ;
- une distribution composée uniquement de comptes agrégés non négatifs ;
- l’absence de bulletins individuels.

## Ce que le contrat ne fait pas

- il ne recalcule pas le jugement majoritaire ;
- il ne certifie pas juridiquement un scrutin ;
- il n’authentifie pas les votants ;
- il ne fournit pas de vote à distance ;
- il ne promet pas encore une compatibilité directe avec une version publiée de l’urne Mieux Voter.

## Étape amont suivante

Comparer ce contrat avec le format réellement exportable par l’urne Mieux Voter et privilégier une contribution upstream pour obtenir un export JSON agrégé stable plutôt qu’un fork.
