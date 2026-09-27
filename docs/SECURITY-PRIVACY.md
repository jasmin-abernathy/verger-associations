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

Les consultations du socle v0.4 sont **explicitement nominatives**. Le nom et la réponse sont enregistrés dans le document partagé et peuvent subsister dans l’historique Automerge même après archivage. Une consultation nécessitant un anonymat réel doit utiliser un protocole distinct, conçu et audité pour cet usage.

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
