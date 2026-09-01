# Modèle de données

## Principes

- conserver le minimum nécessaire ;
- distinguer état de travail et archive officielle ;
- utiliser des identifiants stables ;
- rendre les opérations rejouables sans doublon ;
- prévoir l’export dans un format ouvert ;
- éviter de copier les données de membres déjà présentes dans Hitobito.

## Entités du MVP

### Réunion

| Champ | Type | Exemple |
|---|---|---|
| `id` | chaîne stable | `main` |
| `title` | texte | `Conseil du 15 septembre` |
| `date` | date ISO | `2026-09-15` |

### Point d’ordre du jour

| Champ | Type | Description |
|---|---|---|
| `id` | chaîne unique | Créée localement |
| `text` | texte | Sujet à traiter |
| `done` | booléen | Point traité ou non |
| `createdAt` | date ISO | Tri stable |

### Proposition

| Champ | Type | Description |
|---|---|---|
| `id` | chaîne unique | Identifiant de la proposition |
| `title` | texte | Formulation courte |
| `details` | texte | Contexte ou proposition complète |
| `status` | énumération | `draft`, `discussion`, `objection`, `accepted`, `rejected` |
| `createdAt` | date ISO | Tri stable |

### Action

| Champ | Type | Description |
|---|---|---|
| `id` | chaîne unique | Identifiant de l’action |
| `text` | texte | Résultat attendu |
| `owner` | texte | Responsable saisi explicitement |
| `due` | date ISO ou vide | Échéance |
| `done` | booléen | État d’avancement |
| `createdAt` | date ISO | Tri stable |

## Enveloppe de mise à jour Webxdc

Le prototype échange une opération de la forme :

```json
{
  "version": 1,
  "type": "patch",
  "collection": "actions",
  "id": "identifiant-stable",
  "fields": {
    "done": true
  },
  "stamp": {
    "counter": 12,
    "actor": "adresse-fournie-par-la-messagerie"
  }
}
```

Chaque champ conserve la dernière estampille logique connue. Deux opérations reçues dans un ordre différent convergent vers la même valeur : le compteur le plus élevé gagne, puis l’identifiant de l’acteur départage une égalité.

Cette stratégie convient à un prototype et à de petits objets indépendants. Elle ne résout pas toutes les intentions concurrentes : deux personnes modifiant simultanément le même texte peuvent écraser la modification de l’autre. Ce cas doit être observé pendant le pilote.

## Répartition de la conservation

| Donnée | Emplacement de travail | Emplacement durable |
|---|---|---|
| Ordre du jour en cours | Webxdc | Export facultatif |
| Proposition en discussion | Webxdc | Export si utile |
| Décision adoptée | Webxdc puis export | Stockage documentaire officiel |
| Action de suivi | Webxdc | Back-office si suivi long |
| Membres et rôles | Hitobito | Hitobito |
| Cotisations | Hitobito / outil comptable | Système officiel |
| Procès-verbal signé | Jamais uniquement Webxdc | Stockage documentaire officiel |

## Évolutions prévues

- version explicite du schéma d’export ;
- auteur d’une opération affiché avec prudence ;
- méthode de décision choisie par proposition ;
- objections structurées ;
- date de révision ;
- lien vers l’archive officielle ;
- protocole de migration d’une version de schéma à l’autre.
