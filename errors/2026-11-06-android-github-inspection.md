# Journal de récupération — 6 novembre 2026

Pendant la reprise du prototype Android, un appel de lecture GitHub sur une branche contenant une barre oblique encodée a renvoyé INVALID_ARGUMENT, et une recherche d’un nom de document non confirmé a donné NOT_FOUND. Cause : URL de ressource non conforme / fichier inexistant.

Récupération : utiliser les refs Git SHA et lister les dossiers avant de choisir un chemin ; lire les fichiers existants avant toute mise à jour.

Une tentative de génération de lot multi-fichiers a également échoué avant toute mutation à cause d'une erreur de syntaxe JavaScript dans l'orchestration. Récupération : créer des blobs Git à part puis vérifier les points d'ancrage exacts, assembler une seule arborescence et pousser une fois.

Prévention : contrôler les signatures et les chemins, ne pas extrapoler depuis les branches, et ne pas confondre une exception de l’outil avec un échec produit.