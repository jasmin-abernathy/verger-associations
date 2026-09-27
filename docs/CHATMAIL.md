# Chatmail, Delta Chat et Webxdc — architecture historique v0.2

> Ce document est conservé pour comprendre le prototype initial. Depuis la v0.3, Delta Chat/Webxdc n’est plus une dépendance de Verger Associations. L’architecture cible est décrite dans [`ARCHITECTURE-V03.md`](ARCHITECTURE-V03.md).

## Ce que le prototype a validé

Le prototype Webxdc a démontré qu’un petit outil associatif pouvait :

- préparer une réunion ;
- partager un ordre du jour ;
- structurer propositions et objections ;
- enregistrer décisions et actions ;
- fonctionner hors ligne ;
- exporter un relevé.

Il a aussi montré plusieurs coûts d’intégration : dépendance à un client de messagerie, frontières Webxdc/Internet, besoin de robots pour les services externes et difficulté à faire de l’application associative elle-même le produit principal.

## État actuel

Le code historique reste dans `apps/reunions-decisions` et le paquet `.xdc` reste reproductible. Il ne doit recevoir que des corrections nécessaires tant que la PWA v0.3 n’a pas atteint la parité, puis pourra être archivé.

## Références

- [Webxdc](https://webxdc.org/docs/)
- [Delta Chat](https://delta.chat/)
- [Migration v0.3](MIGRATION-V03.md)
