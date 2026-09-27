# Verger Associations — Android / Capacitor

Statut : **projet Android généré par Capacitor 8.5.2**. Build Vite et tests locaux réussis ; APK debug non compilé dans cet environnement faute d'accès à la distribution Gradle et au SDK Android.

## Choix

Le client Android ne réécrit pas Verger en Kotlin.

Le build Vite existant reste le cœur de l’application et Capacitor ajoute une coque Android native.

```text
HTML / CSS / JS / Automerge
           ↓
          Vite
           ↓
          dist/
           ↓
      Capacitor 8
           ↓
        Android
           ↓
      APK / AAB
```

Le même code métier continue donc d’alimenter la PWA et l’application Android.

## Versions ciblées

- Capacitor Core : 8.5.2 ;
- Capacitor Android : 8.5.2 ;
- Capacitor CLI : 8.5.2 ;
- Node.js : 22.13+.

Capacitor 8 requiert Node 22+.

## Identité Android

```text
appId: org.lepotager.verger.associations
appName: Verger Associations
```

Configuration : `apps/verger-pwa/capacitor.config.json`.

L’application est servie localement dans la WebView sur `https://localhost`.

## Première génération du projet Android

Le dossier `android/` doit être généré avec la CLI Capacitor officielle, puis versionné.

Depuis `apps/verger-pwa` :

```bash
npm install
npm run android:init
```

Le lockfile Capacitor est désormais présent ; utiliser `npm ci` pour repartir d'une installation identique.

Le script :

1. construit la PWA ;
2. exécute `npx cap add android` si le projet Android n’existe pas ;
3. exécute `npx cap sync android`.

Ne pas utiliser GitHub Actions pour cette génération.

## APK debug

Après génération du dossier Android :

```bash
npm run android:apk:debug
```

APK attendu :

```text
apps/verger-pwa/android/app/build/outputs/apk/debug/app-debug.apk
```

Pour Android Studio :

```bash
npm run android:open
```

Pour vérifier l’environnement :

```bash
npm run android:doctor
```

## Serveur

L’APK n’utilise pas le proxy Vite.

Dans **Réglages → Serveur Verger**, configurer :

```text
API :
https://verger.exemple.fr/api/v1

Synchronisation :
wss://verger.exemple.fr/sync

URL publique :
https://verger.exemple.fr/
```

Le frontend de l’application reste embarqué dans l’APK.

## Authentification native

La PWA web conserve les cookies `HttpOnly`.

L’application Capacitor utilise un Bearer token obtenu via :

```text
POST /api/v1/native/login
POST /api/v1/native/invitations/accept
```

Puis :

```http
Authorization: Bearer <session>
```

### Choix de sécurité du premier debug

Le token de session natif est conservé **uniquement en mémoire JavaScript**.

Conséquences :

- fermeture/rechargement complet de l’application → reconnexion nécessaire ;
- aucun token de compte n’est écrit en clair dans `localStorage` ;
- cette limitation est volontaire tant que le stockage via Android Keystore n’est pas implémenté et testé.

Le jeton WebSocket Automerge du pilote reste, lui, une configuration locale existante et n’est pas encore remplacé par l’identité individuelle. Ne pas l'injecter dans un build avec une variable `VITE_` : elle serait visible dans l'APK. Il reste stocké localement dans les réglages et doit être considéré comme accessible sur un appareil compromis.

Le manifeste Android désactive la sauvegarde automatique de l'application. Utiliser l'export JSON manuel pour les données métier ; celui-ci n'inclut pas l'historique Automerge.

## CORS natif

Le serveur accepte par défaut l’origine Capacitor :

```text
https://localhost
```

Variable :

```bash
VERGER_NATIVE_ORIGINS=https://localhost
```

Ne pas utiliser `*` avec des opérations authentifiées.

## Hors ligne

Dans l’APK :

- les fichiers HTML/CSS/JS/WASM sont embarqués ;
- le service worker n’est pas enregistré ;
- IndexedDB/Automerge reste le stockage local ;
- Réunions, Actions, Événements, etc. doivent fonctionner sans serveur ;
- connexion et réponse à une consultation nécessitent le serveur ;
- aucune réponse de consultation n’est annoncée comme comptabilisée avant confirmation HTTP.

## URL publique des résultats

Une WebView locale ne peut pas produire un lien public utile à partir de `https://localhost`.

La valeur `VITE_VERGER_PUBLIC_URL` ou le champ « URL publique du Verger » sert à fabriquer :

```text
https://verger.exemple.fr/?publicPoll=<id>
```

## À tester sur le premier APK

- démarrage sans réseau ;
- conservation IndexedDB après fermeture/réouverture ;
- création et modification de données locales ;
- API HTTPS distante ;
- login Bearer ;
- invitation ;
- consultation ;
- déconnexion ;
- reconnexion exigée après redémarrage complet ;
- WebSocket WSS ;
- perte/récupération du réseau ;
- export/import ;
- clavier Android ;
- TalkBack ;
- rotation écran ;
- mode sombre ;
- safe areas ;
- bouton retour Android.

## Avant une release Play

- générer les vraies icônes adaptatives ;
- définir versionCode/versionName ;
- mettre en place une signature release hors dépôt ;
- remplacer la session mémoire par un stockage natif sécurisé si une connexion persistante est retenue ;
- vérifier les règles Google Play courantes ;
- générer un AAB signé ;
- faire des tests fermés avant production.

## Limites actuelles

Le projet Android existe. `npm run android:doctor` confirme les versions Capacitor 8.5.2. Le premier `./gradlew assembleDebug` a échoué avant compilation en tentant de télécharger `gradle-8.14.3-all.zip` depuis `services.gradle.org` (réseau indisponible). Refaire `npm run android:apk:debug` sur un poste avec Android SDK et accès à Gradle ; ce n'est pas encore une preuve qu'un APK fonctionne sur téléphone.
