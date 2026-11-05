# Validation du 5 novembre 2026

## Exécuté localement (Node 24.22.1)

- `services/verger-sync`: npm ci et npm run check réussis ; tests métier et
  scénario HTTP réel avec SQLite en mémoire, deux organisations et plusieurs comptes.
- `apps/verger-pwa`: npm ci, npm run check et npm run build réussis ; quatre tests
  de passerelle SimpleX (validation, séparation locale, rendu).
- `sh scripts/test.sh`: sept tests Webxdc historiques réussis.
- Navigateur Chromium via prévisualisation Vite : démarrage, navigation Discussion,
  enregistrement d’un lien fictif, conservation après rechargement, refus d’un autre
  domaine sans perte du lien enregistré, retrait du lien. Aucun groupe réel rejoint.
- Écran desktop inspecté. Aucun test d’ouverture de l’application SimpleX installée,
  de téléphone Android, de lecteur d’écran ou de réseau hors ligne dans ce lot.

## Défauts corrigés

- Les origines Web explicitement autorisées pour les mutations ne recevaient pas
  les en-têtes CORS nécessaires. Le préflight et les credentials sont maintenant
  couverts ; SameSite=Lax reste inchangé.
- Réponses de session privées sans directive no-store ; ajout de la directive.
- Une erreur JSON pouvait renvoyer le message du parseur contenant un fragment de
  requête ; remplacement par un message constant. Routes API inconnues en JSON.
- L’ancienne CI ne testait que Webxdc. Un workflow ciblé couvre maintenant PWA et
  autorité HTTP, sans fabriquer d’APK à chaque commit.

## Limites restantes

- Prototype embarqué codé dans le fork ; compilation Android bloquée par la suspension Actions du fork. Tests web du mode embarqué réussis, aucun essai matériel.
- Pas de déploiement serveur ni APK produit par ce lot.
- L’isolation HTTP des consultations ne qualifie pas la synchronisation CRDT
  multi-associations ; celle-ci conserve les limites documentées du jeton partagé.
- npm signale des dépendances transitives uuid/glob dépréciées ; pas de migration
  de dépendances réalisée dans ce lot fonctionnel. Aucun audit global revendiqué.
