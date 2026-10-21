# Tu Étais Là — expérience multimédia

Spécification de conception. Les échanges Telegram, la synchronisation et les pistes musicales ne sont pas encore implémentés. Le prototype possède seulement un fond synthétique activable par son bouton d’ambiance et une bibliothèque locale d’images.

## Sur les téléphones individuels

- Texte : souvenirs, contradictions, tentations et consignes de rôle/camp.
- Image : photo ou document privé, version partielle d’une preuve, détail à comparer sur l’iPad.
- Vocal : message préenregistré ou voix produite ultérieurement, avec possibilité de demander une transcription privée. L’envoi ne prouve pas que le joueur a écouté.
- Appel scénarisé : message « Le Numéro inconnu cherche à vous joindre », boutons Répondre et Refuser. Répondre envoie le vocal dans Telegram ; le joueur doit toucher sa lecture. Refuser ou dépasser le délai produit un appel manqué et une possibilité de rappel ou de transcription pour ne pas perdre un indice essentiel.
- Variante immersive facultative : un lien ouvre un écran web privé avec un appel fictif, les commandes Décrocher/Raccrocher et la lecture du fichier après l’action. Ni cet écran ni le bot ne constituent un véritable appel téléphonique. Ne pas promettre sonnerie ou ouverture automatique sur téléphone verrouillé.

La méthode Telegram phone.requestCall est réservée aux comptes utilisateurs, pas aux bots. Le projet conserve un bot standard, sans automatisation d’un compte personnel.

## Sur l’iPad partagé

Trois couches sonores séparées : musique discrète, ambiance de la maison et effets ponctuels. Les voix collectives ont priorité sur ces couches et déclenchent une baisse temporaire du fond sonore. Lorsqu’un vocal privé est annoncé au groupe par le système, prévoir une baisse temporaire paramétrable ; on ne peut pas détecter automatiquement si le joueur lance sa lecture dans Telegram.

- Musique : nappes lentes, tension progressive, thème de découverte et final.
- Ambiance : vent, craquements éloignés, pluie, grésillement discret.
- Effets : verrou, pas, souffle, bois qui travaille, arrêt soudain du fond.
- Commandes : Activer le son, test sonore, pause/reprise, couper tous les sons et volumes séparés musique/ambiance/effets/voix.
- Démarrage volontaire par une pression de l’utilisateur, conformément aux restrictions de lecture automatique des navigateurs. Prévoir un bouton Reprendre le son après suspension. Les transitions se font par fondus, sans accumulation de plusieurs pistes de la même couche.
- Un mode discret conserve les informations textuelles et permet de finir sans effets sonores. Aucun indice sonore essentiel ne reste sans alternative lisible.

## Rythme et orchestration

Le moteur de session décide du destinataire, du moment, du format, de l’identifiant de contenu et de l’effet sur l’état de la partie. n8n transporte les messages et les événements audio ; le serveur conserve l’état canonique. L’iPad reçoit ses propres événements et lit les fichiers disponibles.

La narration privée est régulière mais pas littéralement continue : cible initiale d’un événement personnel toutes les 2 à 4 minutes, à tester et plafonner. Les messages importants sont mis en file, les appels fictifs sont espacés, les voix collectives ne se superposent pas. La pause du jeu interrompt les échéances narratives ; la reprise ne déclenche pas tous les événements manqués d’un coup.

Les événements de rôle/camp sont variés dans tous les camps, pour que le format vocal ou la réception d’une image ne révèle pas une allégeance. Les faits observables restent cohérents avec le paquet d’énigmes de la session.

## Exemple de séquence

1. Ambiance de vent sur l’iPad.
2. Un joueur reçoit un texte privé décrivant un souvenir.
3. Un autre reçoit une photographie partielle de la porte.
4. L’ouverture d’une preuve produit un son de verrou sur l’iPad.
5. Le Médium reçoit une invitation à répondre à un appel fictif ; le vocal est transmis après son choix.
6. Une voix collective intervient sur l’iPad, dont la musique baisse temporairement.
7. La résolution d’une énigme déclenche un changement d’ambiance par fondu.

## Médias et administration à prévoir

Prévoir les imports audio avec titre, type (musique, ambiance, effet, vocal), affaire, durée, boucle autorisée et transcription pour les voix. La bibliothèque admin actuelle n’accepte que les images ; son extension audio reste à réaliser. Pour les envois Telegram, le serveur devra disposer des fichiers : les imports actuellement stockés dans le navigateur ne sont pas accessibles au bot.

Commencer avec des sons disponibles localement et des voix préenregistrées permet de valider l’expérience sans génération IA en direct. Toute génération API ultérieure doit suivre le parcours de configuration des clés, sans exposer les secrets dans la page.

Sources techniques vérifiées : https://core.telegram.org/bots/api ; https://core.telegram.org/method/phone.requestCall ; https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay .
