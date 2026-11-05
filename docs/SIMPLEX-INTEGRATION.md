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

## Parcours navigateur : passerelle d’invitation

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

## Prototype Android intégré : code préparé, APK non compilé

Branche du fork : `prototype/verger-embedded-20261105`, commit
`d1cf0813ce0f89cd517ce861bb476ff9a9cafb42`.

Une seule application contient l'interface native SimpleX et les outils Verger
embarqués dans une WebView locale. Les boutons internes passent de l'un à l'autre
sans intent vers une application externe. La PWA détecte le pont de navigation
`VergerNative.openChat`, masque les invitations externes et utilise le mode natif.
Aucun message ni clé ne transite dans ce pont.

Le moteur et le cycle de vie SimpleX existants sont conservés. La base identifiée
79d91e7 n'inclut pas les expérimentations Vault/appels collectifs. Le build épingle
Verger à ed99ffc et contrôle la compatibilité des sources du noyau natif réutilisé.

**Blocage constaté :** GitHub Actions indique que les workflows du fork sont
suspendus en raison du volume d'utilisation ; réactivation par le propriétaire
nécessaire. Aucun APK produit ni test Android exécuté dans cette session.

Restent la compilation, les essais sur deux téléphones (messages, arrière-plan,
reprise), l'association explicite des groupes aux espaces associatifs et la
continuité des invitations/révocations. Le verrouillage SimpleX ne protège pas
encore Verger ; import/export WebView à adapter. Ne pas confondre la réussite des
tests web et la validation matérielle du prototype.

## Sources examinées

- Fork : https://github.com/jasmin-abernathy/simplex-chat
- Export RV : https://github.com/jasmin-abernathy/simplex-chat/pull/1
- Capteur d’appel : https://github.com/jasmin-abernathy/simplex-chat/pull/2
- Audio à trois : https://github.com/jasmin-abernathy/simplex-chat/pull/3
- Groupes : https://simplex.chat/docs/guide/secret-groups.html
- Messages/fichiers : https://simplex.chat/docs/guide/send-messages.html
- Appels : https://simplex.chat/docs/guide/audio-video-calls.html
- Pont natif : https://capacitorjs.com/docs/android/custom-code
