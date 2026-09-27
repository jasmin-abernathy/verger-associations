# Sécurité et vie privée

## Principes

- minimisation des données ;
- stockage local-first ;
- conservation limitée ;
- validation humaine ;
- export et réversibilité ;
- services externes facultatifs ;
- aucun pistage ni publicité.

## Appareils

Le stockage local ne protège pas un appareil déverrouillé ou compromis. Le guide de déploiement doit inclure :

- verrouillage de l’appareil ;
- mises à jour ;
- sauvegarde ;
- gestion du départ d’un membre ;
- ajout et révocation d’appareils lorsque l’authentification sera disponible ;
- procédure en cas de perte ou de vol.

## Verger Sync

Le pilote synchronise des documents Automerge via WebSocket.

Protection actuelle :

- endpoint `/sync` dédié ;
- jeton obligatoire d’au moins 24 caractères ;
- comparaison du jeton en temps constant ;
- `sharePolicy: false` : le serveur ne propose pas spontanément les documents qu’il connaît ;
- reverse proxy TLS obligatoire pour un déploiement réel.

Limites :

- le jeton est partagé au niveau du déploiement ;
- il n’existe pas encore de compte individuel ;
- la révocation d’un membre n’est pas encore résolue ;
- le stockage serveur n’est pas encore chiffré côté client par Verger ;
- le jeton du pilote transite actuellement en query string WebSocket car l’adaptateur Automerge standard n’accepte pas d’en-tête d’authentification navigateur ; un reverse proxy qui journalise l’URL complète peut donc enregistrer ce secret.
- la longueur de 24 caractères ne garantit aucune entropie : générer le jeton aléatoirement ; il est conservé dans le navigateur et tous ses détenteurs peuvent accéder aux documents dont ils connaissent l'identifiant ;
- l'identifiant Automerge et le jeton ne constituent pas une invitation révocable ; une exclusion exige au minimum une rotation du jeton et la migration vers un nouveau document, sans effacer les copies déjà obtenues ;
- chaque membre ayant accès au document peut modifier ses données, y compris les décisions : le relevé Markdown doit être validé séparément comme compte rendu officiel.

Le serveur pilote doit rester réservé à un petit groupe de confiance sur une instance dédiée. Il ne convient pas à un service multi-tenant ou à un vote secret.

Pour le pilote, les logs de `/sync` doivent exclure la query string. Le chantier #10 couvre le remplacement de cette protection par un modèle d’identité, d’invitation, de révocation et de chiffrement côté client.

## Identifiant de document

L’URL `automerge:...` permet de nommer un document. Elle doit être traitée comme une information privée et ne doit pas être publiée dans des tickets, logs ou pages publiques.

## Données sensibles

Le socle v0.3 ne doit pas servir par défaut à stocker :

- pièces d’identité ;
- données bancaires ;
- justificatifs sensibles ;
- données de santé ;
- mots de passe ;
- secrets d’API ;
- documents soumis à une politique de conservation spécialisée.

Les membres sont volontairement limités à un nom, rôle et contact facultatif tant que les permissions et durées de conservation ne sont pas stabilisées.

Les annonces d'entraide et leurs coordonnées facultatives sont visibles par toutes les personnes ayant accès au document commun. L'accueil des membres est également une liste partagée, sans documents joints ni transmission automatisée.

Les anciennes consultations du schéma 2 restent des **archives expérimentales non vérifiées** dans Automerge.

Les nouvelles consultations vérifiées utilisent une autorité SQLite séparée du CRDT :
- compte et rôle vérifiés côté serveur ;
- mot de passe dérivé avec `scrypt` + sel aléatoire ;
- sessions et invitations basées sur des secrets aléatoires dont seuls les hashes sont stockés ;
- choix unique par compte ;
- clôture autorisée uniquement au créateur ;
- résultats publics limités aux agrégats.

Ce système n’est **pas E2EE** : le serveur peut lire les comptes et les réponses nominatives. Une consultation anonyme ou secrète nécessite un protocole distinct et audité.

## Dépendances

Les dépendances Automerge sont embarquées au build. La PWA publiée ne doit pas charger de JavaScript métier depuis un CDN tiers.

Les versions doivent être suivies et les builds reproductibles avant une version stable.

## Exports

L’export JSON portable permet de quitter le serveur de synchronisation. Une sauvegarde exportée peut contenir les données du groupe : elle doit être protégée comme les données qu’elle contient.

## Ancien prototype Webxdc

Le modèle de sécurité Delta Chat/Webxdc reste documenté dans `CHATMAIL.md` pour l’historique du prototype v0.2, mais il ne décrit plus l’architecture cible.

## Avant un déploiement réel

Réaliser avec l’association pilote :

- inventaire des données ;
- rôles et droits ;
- durées de conservation ;
- stratégie de sauvegarde ;
- procédure de départ/perte d’appareil ;
- choix d’hébergement ;
- évaluation de la nécessité d’un chiffrement côté client supplémentaire.


## Autorité consultations

Le contrat détaillé est dans `CONSULTATIONS-AUTHORITY.md`.

Le pilote suppose que la PWA et `/api/v1` sont présentés sous la même origine au navigateur. Les sessions utilisent un cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production.

Les réponses ne sont considérées comme enregistrées qu’après confirmation serveur. Une file locale hors ligne ne doit jamais être présentée comme comptabilisée.

Le rôle de compte est séparé du rôle métier libre de la fiche membre. Un `memberId` facultatif relie explicitement les deux.

La récupération de compte, la durée de conservation et la sauvegarde/restauration de `authority.sqlite` restent à définir avant un pilote sensible.


## Cache et consultations

Le service worker ignore explicitement les requêtes `/api/`. Les sessions, listes de consultations et résultats authentifiés ne doivent jamais être servis depuis le cache PWA comme s’ils étaient des ressources hors ligne.

Les réponses aux consultations ne disposent volontairement d’aucune file locale : si le serveur ne confirme pas l’écriture, l’interface indique que la réponse n’a pas été comptabilisée.

Les codes d’invitation sont affichés comme secrets à copier manuellement et ne sont pas placés automatiquement dans une URL.
