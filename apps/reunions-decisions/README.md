# Réunions et décisions — prototype Webxdc

Cette mini-application est le premier prototype exécutable de Verger Associations.

## Tester dans un navigateur

Depuis la racine du dépôt :

```bash
python3 -m http.server 8080
```

Ouvrir ensuite :

- `http://localhost:8080/apps/reunions-decisions/#name=Alice&addr=alice@local.test`
- la même adresse dans un second onglet avec `#name=Bob&addr=bob@local.test`

Les deux onglets partagent les mises à jour avec le petit simulateur `webxdc.js`.

## Construire le paquet

```bash
./scripts/build-xdc.sh
```

Le résultat est écrit dans `dist/reunions-decisions.xdc`. Le simulateur local n’est pas inclus dans le paquet : le client compatible Webxdc fournit sa propre API.

## Tester dans Delta Chat

1. envoyer le fichier `.xdc` dans « Messages enregistrés » ou dans un groupe de test ;
2. toucher « Démarrer » ;
3. ajouter une réunion, des points, des propositions et des actions ;
4. ouvrir la même instance avec un second participant ;
5. vérifier les exports Markdown et JSON.

## Limites du prototype

- aucune suppression ni restauration ;
- une seule réunion par instance Webxdc ;
- fusion champ par champ, sans historique visible des conflits ;
- aucun vote secret ni anonymat garanti ;
- aucun lien Hitobito ;
- aucune valeur juridique sans export et validation externe.
