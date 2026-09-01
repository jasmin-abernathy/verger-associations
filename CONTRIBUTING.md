# Contribuer

Le projet est actuellement en phase de prototype privé. Les contributions les plus utiles portent sur les besoins, les scénarios d’usage, l’accessibilité, la sécurité et les tests multi-appareils.

## Principes

- partir d’un besoin observé ;
- éviter de dupliquer un outil libre satisfaisant ;
- privilégier les solutions petites et compréhensibles ;
- ne collecter aucune donnée sans nécessité ;
- conserver des formats ouverts et exportables ;
- documenter les compromis ;
- tester sur mobile et ordinateur ;
- écrire une interface accessible en français, puis prévoir l’anglais.

## Proposer un changement

1. ouvrir une issue décrivant le besoin ;
2. préciser le public et le scénario ;
3. indiquer où les données doivent être conservées ;
4. vérifier si une mini-app existante répond déjà au besoin ;
5. obtenir un accord avant un développement important.

## Code

Le premier socle est une mini-app Webxdc sans framework ni dépendance distante. Un ajout doit rester utilisable hors ligne et ne pas introduire de requête réseau.

Les changements doivent au minimum vérifier :

- la syntaxe JavaScript ;
- la construction du fichier `.xdc` ;
- l’ouverture dans un navigateur avec le simulateur local ;
- le rejeu des mises à jour sans duplication ;
- la navigation au clavier et le zoom à 200 %.

## Licence

Le choix de licence est encore ouvert. Le dépôt reste privé et aucune contribution externe de code ne sera acceptée avant une décision explicite.
