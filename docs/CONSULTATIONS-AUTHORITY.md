# Autorité comptes et consultations

Statut : **pilote v0.4 — backend autoritaire, non E2EE**.

Ce document décrit la séparation entre :

- le document Automerge, utilisé pour les données collaboratives ordinaires ;
- l’autorité SQLite du serveur, utilisée pour les comptes, rôles, réponses et clôture des consultations.

## Pourquoi sortir les consultations du CRDT partagé

Une consultation où tout détenteur du document peut modifier directement `createdBy`, `closed` ou les réponses ne peut pas appliquer de vrais droits.

Les consultations vérifiées ne doivent donc plus stocker leurs réponses dans Automerge.

Les anciennes consultations du schéma 2 restent lisibles comme **archives expérimentales non vérifiées**. Leurs réponses ne doivent pas être converties en votes authentifiés.

## Rôles de compte

| Rôle | Inviter des comptes | Créer une consultation | Répondre | Clôturer |
|---|---:|---:|---:|---:|
| `administrator` | Oui | Oui | Oui | Ses consultations uniquement |
| `facilitator` | Non | Oui | Oui | Ses consultations uniquement |
| `member` | Non | Non | Oui | Non |
| `reader` | Non | Non | Non | Non |

Le rôle du compte est un droit d’accès.

Le champ libre `member.role` du document Automerge reste un **rôle métier** (présidence, trésorerie, bénévolat, etc.) et ne donne aucun droit serveur.

Un compte possède un `memberId` facultatif pour créer explicitement l’association compte ↔ fiche membre.

## Stockage SQLite

Le serveur utilise les tables suivantes :

- `organizations` ;
- `accounts` ;
- `sessions` ;
- `invitations` ;
- `polls` ;
- `poll_options` ;
- `poll_responses` ;
- `audit_log`.

Une réponse est unique par `(poll_id, account_id)`. Une nouvelle réponse du même compte remplace son choix tant que la consultation reste ouverte.

## États

### Consultation ouverte

- 2 à 8 options ;
- administrateur ou animateur peut créer ;
- `created_by_account_id` provient de la session, jamais du formulaire ;
- administrateur, animateur et membre peuvent répondre ;
- lecteur ne peut pas répondre ;
- le compte peut modifier son choix ;
- aucun résultat détaillé n’est exposé.

### Avant la première réponse

Le créateur peut encore modifier :

- titre ;
- question ;
- options ;
- visibilité des résultats ;
- échéance informative.

### Après la première réponse

Les options et la visibilité deviennent immuables.

### Clôture

Seul le **même compte** que `created_by_account_id` peut clôturer.

Un administrateur différent ne peut pas clôturer à sa place.

### Annulation administrative

Un administrateur peut annuler une consultation via une opération distincte et auditée, par exemple si le compte créateur est perdu.

Cette action n’est jamais présentée comme une clôture effectuée par le créateur.

## Résultats

Les résultats ne sont calculés qu’après clôture.

Réponse agrégée :

```json
{
  "id": "poll-id",
  "title": "Horaire de permanence",
  "question": "Quel créneau retenir ?",
  "status": "closed",
  "total": 12,
  "options": [
    {
      "id": "option-id",
      "label": "Mardi soir",
      "count": 7,
      "percent": 58.33
    }
  ]
}
```

Aucune adresse e-mail, identité de compte ou réponse nominative n’est renvoyée par l’endpoint de résultats.

Une page publique n’est possible que si `results_visibility = public_after_close`.

## API pilote

Toutes les mutations authentifiées utilisent une session par cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production.

Le pilote suppose PWA et API sur la même origine, ou un reverse proxy qui présente la même origine au navigateur.

### Session

- `POST /api/v1/login`
- `POST /api/v1/logout`
- `GET /api/v1/session`

### Invitations

- `POST /api/v1/invitations` — administrateur uniquement ;
- `POST /api/v1/invitations/accept`.

Le rôle est fixé dans l’invitation. La personne invitée ne choisit pas son rôle.

### Consultations

- `GET /api/v1/polls`
- `POST /api/v1/polls`
- `GET /api/v1/polls/:id`
- `PATCH /api/v1/polls/:id` — créateur, avant première réponse seulement ;
- `PUT /api/v1/polls/:id/response`
- `POST /api/v1/polls/:id/close` — créateur uniquement ;
- `POST /api/v1/polls/:id/cancel` — administrateur uniquement ;
- `GET /api/v1/polls/:id/results` — membres authentifiés après clôture ;
- `GET /api/v1/public/polls/:id/results` — uniquement si publication publique autorisée avant les réponses.

## Sécurité du pilote

- mots de passe dérivés avec `scrypt` de Node + sel aléatoire ;
- jetons de session et invitation générés aléatoirement ;
- seuls les hashes des jetons sont stockés en SQLite ;
- vérifications de rôle, association, statut et créateur côté serveur ;
- journal d’audit pour invitations, ouverture, réponse, clôture et annulation ;
- requêtes mutantes refusées si l’`Origin` navigateur ne correspond pas à l’hôte de l’API.

Le pilote **n’est pas E2EE** : le serveur peut lire les comptes et les réponses nominatives.

## Bootstrap

Le premier administrateur est créé explicitement depuis le serveur :

```bash
cd services/verger-sync
read -s VERGER_BOOTSTRAP_PASSWORD
export VERGER_BOOTSTRAP_PASSWORD
npm run bootstrap-admin -- admin@example.org "Mon association" association-id
unset VERGER_BOOTSTRAP_PASSWORD
```

Les comptes suivants passent par invitation. Le pilote affiche un **code d’invitation à copier** plutôt qu’un lien contenant le secret dans la query string, afin de limiter sa présence dans les historiques et journaux HTTP.

## Migration de l’ancien format

Les objets `doc.consultations` Automerge du schéma 2 :

- restent visibles comme archives expérimentales ;
- ne sont plus utilisés pour de nouveaux votes vérifiés ;
- ne sont jamais convertis automatiquement en réponses de comptes ;
- ne doivent pas être publiés comme résultats authentifiés.

Une suppression physique de ces anciennes données n’est pas requise pour le pilote ; leur statut doit être explicite dans l’interface.

## Points restant à décider avant pilote réel

- récupération de compte/mot de passe ;
- politique de durée de session ;
- durée de conservation des réponses ;
- seuil minimal éventuel avant publication publique ;
- comportement d’une échéance dépassée : information seule ou clôture automatique ;
- rôle `reader` à conserver ou non ;
- stratégie de sauvegarde/restauration de `authority.sqlite`.
