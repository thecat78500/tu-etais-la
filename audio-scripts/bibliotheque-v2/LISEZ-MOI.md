# Production de tous les vocaux

## État réel

Ce dossier contient **154 scripts**, pas 154 enregistrements : 107 pour Sally et 47 pour la présence. Aucun appel API et aucune dépense de crédits ElevenLabs n’ont été effectués pour préparer ce dossier. Le premier sally-introduction.mp3 déjà fourni par l’utilisateur reste disponible dans assets/audio ; il n’est pas écrasé.

Ces textes sont une bibliothèque de base couvrant les dix scénarios et les échanges récurrents. Ils ne constituent ni un moteur Telegram connecté ni les cinq énigmes déjà résolubles et validées. Les récits ici sont leurs adaptations fantastiques : consulter le résumé canonique de chaque entrée de scenarios.json avant de préparer une affaire.

## Ordre de travail

1. Rester sur Sally comme demandé. Utiliser Ingrid, Eleven v4, français, stabilité 50 et similarité 75 comme point de départ déjà testé. Conserver la balise d’inquiétude fournie ; la fin réussie propose une émotion de soulagement à tester sur un extrait court.
2. Produire les huit scripts de Sally pour l’affaire choisie, puis ses deux scripts de rôle pour chacun des rôles utilisés. Les scripts communs sont enregistrés une seule fois et réutilisés entre les affaires.
3. Continuer affaire par affaire. Le livret TOUS-LES-TEXTES-SALLY.md rassemble les paroles ; chaque .txt contient exactement la saisie pour ElevenLabs.
4. Télécharger chaque résultat en MP3 en utilisant le nom attendu dans le catalogue. Les noms commencent par A01 à A10 pour les affaires, et COMMUN pour les fichiers réutilisables.
5. Conserver la même voix et les mêmes réglages de base sur toute une série. Ne pas fusionner les 107 textes dans une génération : le bot aura besoin de fichiers séparés pour les envoyer individuellement.
6. Produire la présence ensuite, avec une voix distincte. Tester d’abord quelques phrases avec les balises proposées. Ne pas imiter une voix réelle ou une actrice.

Exemple de nom : A08_SALLY_03_enigme.mp3, à partir du script SALLY/affaire-08/A08_SALLY_03_enigme.txt.

## Destinataires et rythme

- ipad_public : écouter en commun sur la tablette ; baisser l’ambiance pendant la voix.
- telegram_private : envoyer uniquement au joueur choisi par le moteur. Les textes de rôles ne dépendent pas du camp. Les textes de camps, eux, ne doivent jamais être envoyés à un autre camp ni affichés sur l’iPad partagé.
- telegram_private_call_simulated : inviter à Répondre/Refuser, envoyer le vocal après la réponse et laisser le joueur lancer la lecture. Le refus produit un message manqué et l’accès à la transcription. Aucun véritable appel Telegram n’est possible par le bot standard.
- Les messages de fin exigent un résultat final déjà fixé, jamais un simple échec à une énigme intermédiaire.
- Les cinq accompagnements d’énigme utilisent des destinataires tournants. Les messages communs permettent de donner aussi des vocaux aux rôles supplémentaires, de quatre à dix joueurs.
- Ces fichiers sont complétés par les messages texte, les images et les indices variables. Ne pas répéter les mêmes vocaux toutes les deux minutes pour remplir le temps. Laisser les joueurs discuter, ne pas empiler plusieurs messages importants, suspendre la file lors d’une pause.

Les trois messages de doute par affaire ne modifient pas les règles de victoire et ne promettent pas une récompense automatique. Une véritable offre avec conséquence doit être définie séparément par le paquet de jeu et acceptée par bouton.

## Rejouabilité et intégrité

Les noms des invités, les codes, l’ordre des symboles et les solutions ne sont pas figés dans les enregistrements. Ils seront fournis dans les indices propres à la session. Ces fichiers pourront donc être réutilisés lorsque les rôles et les paramètres changeront ; les énigmes doivent néanmoins être conçues et validées séparément pour chaque effectif.

Une même voix n’est pas une authentification. Toute affirmation servant de preuve doit pouvoir être comparée à une archive ou un indice indépendant. Les paroles de la présence sont des interventions narratives, pas des faits acquis. Les souvenirs de Sally sont des perspectives ; leur vérification reste nécessaire.

Pour l’affaire 7, ne pas faire dépendre un code du nombre précis d’ampoules : les deux illustrations restent imparfaitement raccordées. Le délai de référence du scénario doit être établi par les documents du paquet, pas déduit arbitrairement des fichiers image.

## Qualité et transcription

Écouter les mots importants, la prononciation de Sally et les silences. Si une balise est lue à voix haute, corriger la génération avant de transmettre le fichier. Ne pas ajouter la musique aux MP3 : elle sera mixée séparément sur l’iPad.

spoken_text dans catalogue.json correspond à la transcription sans les balises. Prévoir un accès privé à cette transcription pour chaque message privé. Les durées du catalogue sont des estimations textuelles ; elles ne sont pas les durées mesurées des futurs MP3.

Les copies audio doivent rester côté serveur lors de l’intégration Telegram : les fichiers importés seulement dans le navigateur ne sont pas accessibles au bot. La page admin actuelle gère uniquement les images. La présente livraison n’étend pas encore ses imports à l’audio.

## Musiques et effets

Ce dossier concerne les voix. Les musiques d’attente/enquête/tension/rituel et les sons de maison doivent être produits ou choisis séparément ; aucun fichier musical ou effet sonore n’est généré ici. Les dialogues restent volontairement sans fond sonore pour rendre le mixage possible.
