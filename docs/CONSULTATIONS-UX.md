# Consultations — parcours responsive

## Liste

Sur mobile, une seule colonne.

Ordre :

1. consultations ouvertes ;
2. consultations clôturées ;
3. anciennes archives CRDT non vérifiées.

Chaque carte montre :

- titre ;
- échéance éventuelle ;
- état ;
- nombre de réponses ;
- action principale adaptée au compte.

Le bouton **Créer** n’est affiché que pour `administrator` et `facilitator`.

## Création

Écran ou panneau dédié, pas un grand formulaire permanent à côté de la liste.

Champs :

- titre ;
- question ;
- 2 réponses initiales obligatoires ;
- jusqu’à 8 réponses ;
- ajout, retrait et réordonnancement ;
- échéance facultative ;
- visibilité : membres uniquement / page publique après clôture.

Avant d’accepter la publication publique, afficher :

> Les résultats seront visibles après clôture sous forme agrégée. Dans un petit groupe, un choix peut parfois être déduit malgré l’absence de noms.

## Réponse

Aucun champ de nom.

Afficher la session courante puis un vrai groupe de boutons radio.

Action :

- **Enregistrer mon choix** si aucune réponse ;
- **Modifier mon choix** si le compte a déjà répondu.

Ne pas afficher les pourcentages avant clôture.

Une réponse locale en attente n’est jamais présentée comme comptabilisée avant accusé de réception HTTP.

## Clôture

Le bouton n’est rendu que si l’API renvoie `canClose: true`.

Confirmation explicite avant requête.

Même si le bouton était fabriqué manuellement dans le navigateur, l’API doit répondre 403 si le compte n’est pas le créateur.

## Résultats

Après clôture :

- nombre total de réponses ;
- ligne par option ;
- nombre ;
- pourcentage exact ;
- diagramme circulaire ;
- légende textuelle ;
- état vide si zéro réponse.

Le graphique est décoratif en complément des valeurs textuelles, jamais la seule représentation.

## Public

Une page publique ne reçoit que l’objet agrégé.

Elle ne doit contenir :

- ni compte ;
- ni `memberId` ;
- ni URL Automerge ;
- ni jeton Verger Sync ;
- ni détail de réponse individuelle.

## Accessibilité

À vérifier :

- groupe radio avec `fieldset` et `legend` ;
- ordre de tabulation ;
- focus après enregistrement ;
- confirmation de clôture annoncée ;
- résultats lisibles sans graphique ;
- zoom 200 % ;
- largeur 360–390 px ;
- contraste du diagramme et motifs/légende suffisants.
