# Migration du prototype Webxdc vers la PWA v0.3

## Conservé

- le cycle Réunion → ordre du jour → proposition → contribution → décision → action ;
- les types clarification, réaction, objection et amendement ;
- l’archivage plutôt que la suppression silencieuse ;
- la date de révision ;
- l’export et la réversibilité ;
- l’exigence d’accessibilité ;
- la sobriété et l’absence de télémétrie.

## Remplacé

- `webxdc.sendUpdate` et le compteur logique maison → Automerge ;
- stockage dans une instance Webxdc → IndexedDB local ;
- Delta Chat obligatoire → PWA autonome ;
- robot Chatmail obligatoire pour les intégrations → connecteurs à définir selon les besoins ;
- Hitobito source obligatoire → imports/connecteurs Paheko ou Hitobito facultatifs.

## Prototype historique

`apps/reunions-decisions` reste dans le dépôt tant que la PWA v0.3 n’a pas atteint la parité métier et réussi un pilote réel.

Il pourra ensuite être déplacé vers un dossier `legacy/` ou archivé avec une dernière version documentée.

## Parité minimale avant archivage du prototype

- créer une réunion ;
- ordre du jour ;
- propositions ;
- clarifications/réactions/objections/amendements ;
- décision et méthode ;
- actions liées ;
- date de révision ;
- exports ;
- modifications concurrentes sur deux appareils ;
- navigation clavier et zoom 200 %.
