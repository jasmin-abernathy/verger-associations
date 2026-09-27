# MVP — Verger Associations autonome

## Objectif

Valider qu’un petit groupe associatif peut utiliser une seule application pour préparer une réunion, décider, répartir les suites et coordonner quelques besoins courants, même avec une connexion intermittente.

## Version 0.3 — périmètre pilote

Le pilote doit couvrir :

- une association ;
- membres et rôles simples ;
- plusieurs réunions ;
- ordre du jour ;
- propositions et contributions ;
- méthode et résultat de décision ;
- actions ;
- événements simples ;
- besoins bénévoles ;
- export/import de sauvegarde ;
- fonctionnement hors ligne ;
- synchronisation Automerge entre plusieurs clients.

## Parcours principal

1. Une personne ouvre ou installe la PWA.
2. Elle crée l’espace de l’association.
3. Elle ajoute quelques membres.
4. Le groupe prépare une réunion.
5. Les participants contribuent à une proposition.
6. Le groupe enregistre la méthode et la décision.
7. Les suites deviennent des actions avec responsables et échéances.
8. Un événement ou besoin bénévole peut être créé sans changer d’outil.
9. Les données restent accessibles hors ligne.
10. Une sauvegarde portable peut être exportée indépendamment du serveur.

## Critères d’acceptation technique

- build PWA reproductible ;
- aucune dépendance à un CDN JavaScript au runtime ;
- stockage local IndexedDB ;
- modifications concurrentes qui convergent via Automerge ;
- utilisation possible pendant une panne de synchronisation ;
- reprise de synchronisation après reconnexion ;
- export/import JSON ;
- navigation clavier ;
- zoom 200 % ;
- lecteur d’écran sur les parcours essentiels ;
- aucune télémétrie ou publicité.

## Critères du pilote associatif

- 4 à 7 personnes ;
- prise en main initiale inférieure à 15 minutes ;
- au moins deux réunions réelles ;
- au moins un usage hors ligne réel ou simulé ;
- aucune décision importante perdue ;
- participants capables de retrouver les actions et décisions ;
- demande explicite de poursuivre l’essai.

## Hors périmètre initial

- comptabilité complète ;
- pièces d’identité ;
- paie ;
- vote juridiquement certifié ;
- authentification forte multi-tenant ;
- remplacement immédiat de Paheko/Hitobito ;
- messagerie et visioconférence complètes.

## Définition de « terminé »

Le MVP n’est pas terminé lorsque le code compile : il est terminé lorsqu’un petit groupe a mené de vraies réunions, travaillé avec une coupure de réseau, retrouvé ses données et compris où se trouvent décisions et actions.
