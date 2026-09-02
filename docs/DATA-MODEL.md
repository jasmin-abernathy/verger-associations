# Modèle de données

## Principes

- conserver le minimum nécessaire ;
- distinguer état de travail et archive officielle ;
- utiliser des identifiants stables ;
- rendre les opérations rejouables sans doublon ;
- prévoir un export dans des formats ouverts ;
- éviter de copier les données de membres déjà présentes dans Hitobito ;
- archiver logiquement au lieu d’effacer silencieusement.

## Entités du pilote

### Réunion

`title`, `date`, `facilitator`, `secretary` et `archiveReference` décrivent la réunion et le lien humainement lisible vers sa future archive officielle.

### Point d’ordre du jour

`text`, `done`, `archived`, `createdAt`, `updatedAt` et `updatedBy` décrivent un sujet à traiter.

### Proposition

`title`, `details`, `status`, `decisionText`, `reviewDate`, `archived`, `createdAt`, `updatedAt` et `updatedBy` décrivent la délibération et son résultat.

Les statuts admis sont `draft`, `clarification`, `discussion`, `objection`, `amendment`, `accepted` et `rejected`.

### Contribution

`proposalId`, `type`, `text`, `author`, `resolved`, `archived`, `createdAt`, `updatedAt` et `updatedBy` rattachent une clarification, réaction, objection ou proposition d’amendement à une proposition.

### Action

`proposalId`, `text`, `owner`, `due`, `done`, `archived`, `createdAt`, `updatedAt` et `updatedBy` décrivent une suite concrète. Le lien à une proposition est facultatif.

## Enveloppe de mise à jour Webxdc

```json
{
  "version": 2,
  "type": "patch",
  "collection": "contributions",
  "id": "identifiant-stable",
  "fields": {
    "proposalId": "proposal-123",
    "type": "objection",
    "text": "Prévoir une rotation",
    "resolved": false
  },
  "stamp": {
    "counter": 12,
    "actor": "adresse-fournie-par-la-messagerie"
  }
}
```

Chaque champ conserve la dernière estampille logique connue. Le compteur le plus élevé gagne, puis l’identifiant de l’acteur départage une égalité. Les opérations 0.1 de version `1` restent acceptées.

Les collections, champs, types et tailles de texte sont validés avant application. Les identifiants susceptibles de modifier le prototype JavaScript sont refusés.

## Convergence et limites

Une mise à jour rejouée ne crée pas de doublon. Deux séries d’opérations reçues dans un ordre différent convergent vers la même valeur. Deux personnes modifiant simultanément le même champ peuvent cependant écraser l’intention de l’autre : ce cas doit être observé pendant le pilote.

## Répartition de la conservation

| Donnée | Emplacement de travail | Emplacement durable |
|---|---|---|
| Ordre du jour en cours | Webxdc | Export facultatif |
| Proposition en discussion | Webxdc | Export si utile |
| Décision adoptée | Webxdc puis export | Stockage documentaire officiel |
| Action de suivi | Webxdc | Back-office si suivi long |
| Membres, rôles et cotisations | Hitobito | Hitobito |
| Procès-verbal signé | Jamais uniquement Webxdc | Stockage documentaire officiel |

## Export JSON

L’export `schemaVersion: 2` contient les cinq collections. Les éléments archivés y restent présents afin de préserver la réversibilité ; ils sont masqués dans le relevé Markdown courant.
