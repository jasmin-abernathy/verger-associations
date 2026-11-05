# SimpleX et Verger Associations — état au 5 novembre 2026

## Choix produit

Réutiliser SimpleX pour la communication, garder les outils métier dans Verger.
Le module reste facultatif : réunions, décisions et actions restent utilisables sans
SimpleX. Communication libre reste un projet distinct ; aucune fusion de dépôts.

## Ce qui peut remplacer du développement

| Besoin | Réutilisation envisagée | Ce qui reste dans Verger |
| --- | --- | --- |
| Discussions de groupe et messages directs | Moteur et interface SimpleX existants | Association explicite entre espace et groupe ; consentement |
| Photos, fichiers, vocaux, réactions | Fonctions SimpleX existantes | Pas de nouvelle messagerie/transport de fichiers à construire |
| Accueil des nouveaux membres | Invitations et message d’accueil SimpleX | Checklist d’accueil, rôles métier et documents administratifs |
| Échanges autour d’un signalement | Discussion et envoi de pièces via SimpleX | Dossier structuré, responsable, état, résolution et conservation des preuves |
| Alertes aux membres | Notification d’un message SimpleX | Détection, qualification, échéances et envoi explicite à concevoir |
| Appels individuels | SimpleX existant, sous réserve de la compatibilité appareils | Aucune nouvelle pile d’appel individuel |
| Appels collectifs | Prototype du fork PR #3 seulement | Intégration native et tests à trois appareils encore nécessaires |
| Consultations et jugement majoritaire | Ne pas substituer des réactions de chat à un vote | Une réponse par compte, clôture, droits, agrégation et intégration Mieux Voter |
| Sync des documents métier | Ne pas remplacer Automerge/Verger Sync dans ce lot | Convergence hors ligne, autorisation/révocation, sauvegardes |
| Sauvegarde | Export RV du fork encore expérimental | Restauration Verger et SimpleX à qualifier séparément |

Le chiffrement des messages SimpleX ne chiffre pas automatiquement les documents
Automerge ou les réponses SQLite. Les rôles SimpleX ne sont pas les rôles Verger.
Un retrait du groupe ne révoque pas un compte Verger, ni inversement.

## Livré dans cette branche : passerelle d’invitation

Entrée « Discussion SimpleX » dans la navigation PWA/Capacitor. L’utilisateur peut
conserver, modifier, ouvrir ou copier un lien HTTPS SimpleX. Il reste en stockage
local, associé au document courant ; ni CRDT, ni export JSON, ni envoi automatique.
Les liens externes utilisent `noreferrer`. Une entrée invalide ne remplace pas le
lien existant. Le formulaire reste rempli en cas d’erreur.

C’est une passerelle vers l’application installée, **pas un chat embarqué**. Elle ne
force pas l’ouverture du fork : la résolution des liens appartient au système.
Seuls les liens HTTPS `simplex.chat` sont acceptés dans ce premier lot ; les liens
sur domaines de relais et les URI `simplex:` ne sont pas convertis silencieusement.
Sans application installée, la page SimpleX s’ouvre. Sans réseau, Verger et le lien
local restent disponibles, mais aucune livraison de message n’est garantie.

Le contenu du lien reste une invitation privée, lisible par les scripts de même
origine comme les autres données locales. Aucune clé de chiffrement SimpleX n’est
stockée dans Verger. Aucun groupe réel n’a été créé ni rejoint par l’automatisation.

## Intégration embarquée : travail nécessaire

1. Partir d’un commit stable identifié du fork, sans fusionner ses trois PR
   expérimentales. Mettre à jour la base avec l’amont après comparaison.
2. Faire un prototype Android du moteur natif et de son cycle de vie : bases
   chiffrées, clés dans le stockage adapté, notifications, arrière-plan et reprise.
3. Définir un pont Capacitor restreint (liste/envoi/réception), sans commande brute
   ni socket d’administration exposés au Web. Une API de bot hébergée n’est pas un
   client privé par membre : l’hébergeur en serait un endpoint de déchiffrement.
4. Associer explicitement profil/groupe SimpleX et association Verger sans déduire
   les identités des noms affichés. Définir invitation, départ et révocation.
5. Tester deux appareils, reprises réseau, destinataires, doublons et sauvegardes.
   Trois appareils et TURN pour le prototype d’appels collectifs.
6. Définir séparément le parcours PWA : le moteur natif Android n’est pas un module
   JavaScript que l’on peut simplement importer dans Vite.

La réussite du build web ne valide pas ce portage. Ne pas annoncer un chat intégré
avant envoi/réception réels entre deux installations.

## Sources examinées

- Fork : https://github.com/jasmin-abernathy/simplex-chat
- Export RV : https://github.com/jasmin-abernathy/simplex-chat/pull/1
- Capteur d’appel : https://github.com/jasmin-abernathy/simplex-chat/pull/2
- Audio à trois : https://github.com/jasmin-abernathy/simplex-chat/pull/3
- Groupes : https://simplex.chat/docs/guide/secret-groups.html
- Messages/fichiers : https://simplex.chat/docs/guide/send-messages.html
- Appels : https://simplex.chat/docs/guide/audio-video-calls.html
- Pont natif : https://capacitorjs.com/docs/android/custom-code
