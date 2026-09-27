# Déploiement serveur pour l’application Android

## Cible simple

Une seule origine HTTPS publique peut exposer :

```text
https://verger.exemple.fr/api/v1/...   → API comptes / consultations
wss://verger.exemple.fr/sync           → Automerge WebSocket
https://verger.exemple.fr/             → PWA / pages publiques facultatives
```

Le processus Node `services/verger-sync` écoute localement sur le port 3030.

## Variables principales

```bash
PORT=3030
DATA_DIR=/data
VERGER_AUTH_DB=/data/authority.sqlite

VERGER_SYNC_TOKEN=<secret-aléatoire>
VERGER_COOKIE_SECURE=true

# PWA web servie depuis une autre origine si nécessaire
VERGER_ALLOWED_ORIGINS=https://verger.exemple.fr

# Capacitor Android
VERGER_NATIVE_ORIGINS=https://localhost
```

## Reverse proxy — exemple conceptuel

Le reverse proxy doit :

- terminer TLS ;
- transmettre `/api/` vers Node en HTTP ;
- transmettre `/sync` avec Upgrade WebSocket ;
- ne pas journaliser la query string de `/sync`, car elle contient encore le jeton pilote ;
- transmettre correctement `Host`, `X-Forwarded-Proto` et les en-têtes WebSocket.

Exemple Nginx à adapter :

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3030;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /sync {
    proxy_pass http://127.0.0.1:3030;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Adapter le format de logs afin de ne pas enregistrer ?token=...
}
```

## Endpoints natifs

Le client Android utilise :

```text
POST /api/v1/native/login
POST /api/v1/native/invitations/accept
```

Ces endpoints renvoient un token de session.

Les appels suivants utilisent :

```http
Authorization: Bearer <token>
```

Le serveur continue à accepter les sessions cookie de la PWA web.

## Origine Capacitor

La configuration Android utilise :

```json
{
  "server": {
    "hostname": "localhost",
    "androidScheme": "https"
  }
}
```

L’origine attendue est donc :

```text
https://localhost
```

Cette origine doit apparaître dans `VERGER_NATIVE_ORIGINS`.

## Ce qui ne dépend pas du serveur

Le serveur ne sert pas l’interface principale de l’APK.

Sans connexion, l’application peut toujours ouvrir son bundle local et les données Automerge déjà présentes sur le téléphone.

## Sauvegardes serveur

À sauvegarder ensemble :

- répertoire Automerge `DATA_DIR` ;
- `authority.sqlite` ;
- configuration/secrets séparément.

Une procédure de restauration complète reste à tester avant un pilote réel.
