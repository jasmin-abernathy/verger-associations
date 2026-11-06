# Créer un espace associatif dans Verger

## Parcours de première ouverture (PWA et APK de test)

1. **Association** : renseigner le nom et une description facultative.
2. **Apparence et modules** : choisir une couleur, importer un logo PNG/JPEG/WebP (redimensionné localement, 512 px maximum), cocher les modules utiles.
3. **Responsable** : saisir le nom de domaine de l'association, une adresse e-mail et un mot de passe d'au moins douze caractères.
4. **Preuve de contrôle du domaine** : copier l'enregistrement TXT affiché, l'ajouter dans la zone DNS et demander la vérification.
5. **Création** : le serveur interroge lui-même les DNS, crée l'association et son premier compte administrateur uniquement si le défi est correct. Le code expire au bout d'une heure.

Exemple : pour `association.fr`, le nom TXT est `_verger.association.fr`. Sa valeur commence par `verger-domain-verification=` et contient un secret aléatoire, différent pour chaque tentative. Il ne faut ni transmettre les identifiants de l'hébergeur ni modifier les serveurs DNS.

Le contrôle du domaine **ne prouve pas juridiquement que la personne représente l'association**, mais prouve qu'elle peut publier l'enregistrement demandé. Une association sans domaine propre peut explorer Verger en local, sans obtenir un espace vérifié.

## Accès et menus

Sur petit écran, le menu affiche seulement Accueil, Événements, Messagerie et Plus. `Plus` donne accès aux modules activés et à l'espace responsable. Sur ordinateur, le menu latéral expose les modules activés.

L'`Espace responsable` propose un formulaire de connexion. Seul un compte avec le rôle `administrator` dans la bonne association accède à la gestion des membres, au suivi d'accueil, aux paramètres du serveur, aux sauvegardes et à la personnalisation. Ces vérifications sont faites dans l'interface pour les modules local-first ; elles **ne remplacent pas les ACL serveur**. Les consultations vérifiées sont, elles, protégées par des rôles appliqués dans l'API.

L'application est **une seule APK Verger** avec SimpleX embarqué, pas un fork à lancer séparément. Le chat est un groupe privé associé localement au téléphone, avec les limites détaillées dans `docs/SIMPLEX-INTEGRATION.md`. Le simple fait de valider un domaine ne crée pas un groupe SimpleX.

## Serveur requis

La preuve de domaine nécessite le serveur `services/verger-sync` avec l'API `/api/v1`, une base SQLite accessible et un résolveur DNS opérationnel. Les requêtes d'authentification doivent passer en HTTPS ; configurer les origines autorisées dans `VERGER_ALLOWED_ORIGINS` et `VERGER_NATIVE_ORIGINS`. Pour **l'APK SimpleX embarquée**, l'origine WebView à autoriser est précisément `https://appassets.androidplatform.net` (par exemple `VERGER_NATIVE_ORIGINS=https://appassets.androidplatform.net`), et non seulement la valeur par défaut `https://localhost`. L'APK de prototype peut demander l'URL du serveur si elle n'a pas été définie au build.

- `POST /api/v1/organizations/verification/start` : crée un défi, affiche le nom et la valeur du TXT, expire au bout de 60 minutes.
- `POST /api/v1/organizations/verification/complete` : valide le DNS et crée le compte responsable avec cookie sécurisé.
- `POST /api/v1/native/organizations/verification/complete` : même preuve, avec session Bearer pour le prototype Android et origine native autorisée.

Les demandes sont limitées par adresse IP côté serveur. Une fois le domaine inscrit, les doubles enregistrements sont rejetés.

## Limites du pilote

- La synchronisation Automerge actuelle utilise un jeton partagé. **Ne pas mutualiser un serveur Sync entre associations indépendantes sans implémenter l'isolation par association et les ACL.**
- Le service ne provisionne pas encore automatiquement un espace Sync par association, ni la messagerie SimpleX ou les invitations.
- Les sessions natives du prototype sont conservées uniquement en mémoire et nécessitent une reconnexion après un redémarrage complet.
- La modification visuelle du logo concerne l'intérieur de Verger ; le nom et l'icône sur le lanceur Android restent ceux de l'APK commune.
- Aucun hébergement Verger de production n'est implicitement configuré par ce parcours. Ne pas déclarer une association « prête pour plusieurs appareils » avant déploiement et tests de synchronisation.
