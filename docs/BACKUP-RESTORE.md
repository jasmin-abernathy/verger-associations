# Sauvegarde et restauration

## Ce que contient l’export

L’export `.verger.json` contient l’état métier courant :

- association ;
- membres et accueil ;
- réunions, ordre du jour, propositions et contributions ;
- décisions ;
- actions ;
- événements ;
- bénévolat ;
- entraide ;
- consultations ;
- autres collections déjà présentes dans le schéma.

Il contient aussi `schemaVersion` et la date d’export.

## Ce que l’export ne contient pas

Le JSON portable **ne conserve pas l’historique CRDT Automerge** ni la chronologie complète des changements concurrents.

Il constitue une sauvegarde métier et un format de migration, pas une image complète de la base Automerge.

## Comportement à l’import

L’import ne remplace pas le document courant.

Verger :

1. lit et valide le fichier ;
2. crée un nouveau document Automerge ;
3. applique les migrations de schéma nécessaires ;
4. bascule l’application vers ce nouvel espace ;
5. conserve l’ancien document tant qu’il n’est pas supprimé séparément du stockage local.

Ce comportement limite le risque de détruire une copie fonctionnelle lors d’une restauration.

## Vérification après restauration

Après import, vérifier au minimum :

- nom de l’association ;
- membres ;
- réunions et décisions ;
- actions ;
- événements ;
- besoins bénévoles ;
- annonces d’entraide ;
- consultations ;
- export Markdown d’une réunion importante.

## Sauvegardes sensibles

Une sauvegarde JSON est lisible en clair. Elle doit être protégée comme les données qu’elle contient.

Tant que le chantier E2EE n’est pas terminé :

- ne pas la publier ;
- ne pas la joindre à un ticket public ;
- éviter les données sensibles ;
- privilégier un stockage local ou chiffré adapté.

## Restauration et synchronisation

Importer une sauvegarde crée un **nouvel identifiant Automerge**.

Les autres appareils ne basculent pas automatiquement vers ce nouvel espace. Il faut leur transmettre le nouveau lien privé après validation de la restauration.

## Limite actuelle

Il n’existe pas encore de sauvegarde/restauration complète du journal Automerge côté serveur. Ce besoin fait partie du chantier de sécurité, d’identité et d’exploitation avant une version stable.
