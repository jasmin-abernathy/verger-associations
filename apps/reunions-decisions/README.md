# Réunions et décisions — pilote Webxdc

Cette mini-application est le premier module exécutable de Verger Associations, édité par **Le Verger du Numérique**. Elle aide un petit groupe à préparer une réunion, délibérer, consigner une décision et répartir les suites dans une conversation Delta Chat.

## Fonctions de la version 0.2

- fiche de réunion : titre, date, animation, prise de notes et référence de l’archive officielle ;
- ordre du jour partagé et suivi des points traités ;
- propositions suivant les étapes brouillon, clarification, discussion, objection, amendement, adoption ou rejet ;
- clarifications, réactions, objections et amendements rattachés à une proposition ;
- traitement explicite des contributions ;
- formulation exacte d’une décision et date facultative de révision ;
- actions, responsables, échéances et lien vers la proposition concernée ;
- archivage réversible des éléments saisis par erreur ;
- relevé Markdown lisible et export JSON structuré ;
- synchronisation rejouable et fusion champ par champ entre les participants.

Le module ne vote pas à la place du groupe et n’impose aucune méthode de gouvernance.

## Tester dans un navigateur

Depuis la racine du dépôt :

```bash
python3 -m http.server 8080
```

Ouvrir ensuite deux onglets :

- `http://localhost:8080/apps/reunions-decisions/#name=Alice&addr=alice@local.test`
- `http://localhost:8080/apps/reunions-decisions/#name=Bob&addr=bob@local.test`

Les onglets partagent les mises à jour par le simulateur local `webxdc.js`.

## Vérifier et construire

```bash
sh scripts/test.sh
./scripts/build-xdc.sh
```

Le paquet est écrit dans `dist/reunions-decisions.xdc`. Le simulateur local n’y est pas inclus : Delta Chat fournit sa propre API Webxdc.

## Tester dans Delta Chat

1. télécharger l’artefact `reunions-decisions-xdc` produit par GitHub Actions ;
2. envoyer le fichier `.xdc` dans « Messages enregistrés » ou un groupe de test ;
3. toucher « Démarrer » ;
4. suivre les cinq étapes affichées dans l’application ;
5. ouvrir la même instance avec une seconde personne ;
6. vérifier qu’une objection, une décision et une action apparaissent sur les deux appareils ;
7. partager les exports Markdown et JSON.

## Compatibilité et conservation

Les mises à jour du prototype 0.1 sont encore comprises. Le relevé reste un document de travail : les procès-verbaux définitifs et les données ayant une durée légale de conservation doivent être archivés dans l’espace officiel de l’association.

## Limites actuelles

- une seule réunion par instance Webxdc ;
- pas de vote secret ni de garantie d’anonymat ;
- pas de signature électronique ;
- pas de pièces jointes ni de lien Hitobito ;
- fusion champ par champ : deux modifications simultanées du même texte peuvent se départager sans présenter un écran de conflit ;
- aucun droit particulier n’empêche un participant de changer un statut ;
- validation sur appareils réels encore nécessaire avant de qualifier la version de stable.
