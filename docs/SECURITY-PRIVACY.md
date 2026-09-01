# Sécurité et vie privée

## Principes

- minimisation des données ;
- chiffrement de bout en bout ;
- conservation limitée ;
- validation humaine ;
- export et réversibilité ;
- séparation entre données de travail et archives officielles.

## Données visibles par le relais

Le contenu des messages est chiffré. L’opérateur du relais peut néanmoins connaître certaines métadonnées techniques, notamment les adresses d’expédition et de réception ainsi que les dates d’échange.

Le projet ne doit donc jamais promettre « zéro métadonnée ».

## Appareils

Le chiffrement ne protège pas un appareil déverrouillé ou compromis. Le guide de déploiement devra inclure :

- verrouillage de l’appareil ;
- mises à jour ;
- gestion du départ d’un membre ;
- ajout et révocation d’appareils ;
- procédure en cas de perte ou de vol.

## Robots

Un robot participant à une conversation peut lire les messages qui lui sont destinés. Chaque robot doit :

- avoir une finalité unique et documentée ;
- traiter le minimum de contenu ;
- éviter les journaux inutiles ;
- annoncer clairement sa présence ;
- disposer d’une durée de conservation ;
- permettre sa désactivation.

## Webxdc

- pas d’accès silencieux à Internet ;
- dépendances embarquées et vérifiables ;
- stockage local limité au besoin ;
- export explicite ;
- aucune télémétrie ni publicité.

## Données à ne pas conserver uniquement dans Chatmail

- comptabilité ;
- statuts et procès-verbaux définitifs ;
- pièces d’identité ;
- justificatifs ;
- adhésions et cotisations ;
- données nécessitant une durée légale de conservation.

## Avant un déploiement réel

Une analyse des données, des rôles et des durées de conservation doit être réalisée avec l’association pilote.
