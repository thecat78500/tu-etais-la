# Enregistrer les voix de « Tu Étais Là »

## Ce qui est livré

- SCRIPTS-ENREGISTREMENT.md : les dix scripts, leur direction d’interprétation et leurs déclenchements.
- Dix fichiers .txt : uniquement les paroles à lire, sans consignes de jeu ni annotations à prononcer.
- clips.json : métadonnées préparatoires pour le futur moteur. Les noms de déclenchements sont des contrats de conception, pas des événements déjà implémentés.
- generer-textes.cjs : régénère les textes et le livret depuis clips.json, sans appel à une API.

**Aucun MP3 n’est fourni et aucun message Telegram n’a été envoyé.**

## Référence narrative pour ces enregistrements

Ces scripts concernent l’adaptation fantastique de « La clé n’ouvrait pas cette porte ». Elle remplace, pour ce paquet audio uniquement, la version réaliste où Sally avait quitté les lieux après une menace.

Sally est retenue dans une version impossible de la maison. La clé photographiée ouvre le secrétaire matériel, pas le passage surnaturel. La présence exploite les interprétations des invités. Les cinq énigmes rassemblent les éléments d’un rituel. Le bon rituel ramène Sally et ferme le passage ; une mauvaise décision ou le désaccord final le laisse ouvert. La chaîne précise d’indices, les codes variables et les objectifs personnels restent à écrire et tester.

Les passages enregistrés ne donnent ni code numérique, ni prénom d’invité, ni nombre de participants, ni composition des camps. Ils peuvent donc être réutilisés de quatre à dix joueurs et avec plusieurs variantes. Les indices variables seront fournis en texte ou dans des documents dédiés, ou feront l’objet de clips supplémentaires lorsque les paquets d’énigmes seront validés.

## Deux voix à préparer

### Sally

Voix adulte francophone, naturelle, intime et intelligible. Émotion contenue, fatigue, urgence progressive. Éviter les cris et les chuchotements qui font perdre les mots. Conserver la même voix dans tous ses fichiers. Prononcer Sally « Sa-li ». Il s’agit de notre personnage fictif, pas d’une imitation d’actrice du film de référence.

Consigne à copier dans un outil de voix :

> Interprète ce texte en français avec une voix féminine adulte naturelle, proche du micro et clairement intelligible. La personne cherche à rester calme malgré sa peur. Émotion retenue, silences brefs, sans théâtralité excessive. Aucun cri. N’ajoute ni mot, ni musique, ni effet. Prononce Sally « Sa-li ». Lis uniquement le texte fourni.

### La présence

Voix adulte francophone distincte de Sally, calme et persuasive, pouvant être féminine ou masculine. Une douceur déplacée, sans voix de monstre caricaturale. Même voix sur toute la série. Ne pas chercher à imiter une personne réelle.

Consigne à copier dans un outil de voix :

> Interprète ce texte en français avec une voix adulte calme, intime et persuasive. Elle semble patiente, presque bienveillante, mais son assurance crée un malaise. Débit posé, diction nette, aucune colère, aucun rire démoniaque. Aucun cri. N’ajoute ni mot, ni musique, ni effet. Lis uniquement le texte fourni.

## Format des fichiers à me remettre

- Un fichier par script, avec exactement le nom indiqué dans le livret.
- MP3 de préférence ; un enregistrement M4A ou WAV peut également être fourni et sera adapté ensuite au canal de lecture.
- Voix seule, sans musique mélangée au fichier. Le moteur gérera le fond sonore séparément.
- Laisser environ une demi-seconde de silence avant la voix et une seconde après, sans longue attente.
- Volume régulier, aucune saturation et pas de différence brusque de niveau entre les clips.
- Les durées sont des estimations ; privilégier la compréhension plutôt qu’un débit artificiel pour atteindre une durée exacte.

Ordre pratique : produire d’abord sally-introduction.mp3 et presence-introduction.mp3 pour valider les deux voix, puis enregistrer les huit autres avec ces mêmes réglages.

## Déroulement sonore des cinq énigmes

| Moment | Fichier / action | Fond sur l’iPad |
|---|---|---|
| Installation | Test sonore volontaire et lecture des règles en texte | Attente discrète |
| Début énigme 1 | sally-introduction, puis fragments privés | Baisser le fond pendant la voix |
| Après distribution initiale | presence-introduction, une fois Sally terminée | Reprise douce entre les deux voix |
| Énigme 1 | sally-souvenir-01 au Médium, après acceptation de l’appel fictif | Fond léger, aucune autre voix publique |
| Énigme 2 | presence-tentation-01 à un destinataire de la session | Tension discrète |
| Énigme 3 | sally-souvenir-02 au Gardien ; presence-tentation-02 à un autre joueur | Espacer les deux messages ; pas de déclenchement simultané systématique |
| Énigme 4 | sally-souvenir-03 au Revenant | Temps calme pour comparer les preuves |
| Énigme 5 | presence-tentation-03 avant le vote | Fond du rituel, sous le niveau des voix |
| Après résolution du vote | Une seule des deux fins selon l’état canonique | Fondu de baisse, puis fin sonore |

Le Veilleur et les rôles supplémentaires reçoivent également leurs informations en texte/image. L’absence d’un vocal personnel dédié dans ce premier lot ne signifie pas qu’ils sont sans tâche. La bibliothèque devra s’enrichir pour éviter que les mêmes trois personnes reçoivent toujours les mêmes formats.

## Règles de diffusion

1. Les introductions et les fins sont collectives. Les souvenirs et les tentations sont privés : ne pas les jouer sur l’iPad partagé.
2. Sur Telegram, répondre à un appel fictif transmet le vocal ; le joueur touche ensuite sa lecture. Un bot ne peut pas lancer un vrai appel Telegram.
3. La transcription reprend exactement les paroles du .txt et reste disponible au même destinataire. Un indice ne dépend jamais de la capacité d’entendre une déformation sonore.
4. Une invitation refusée laisse le vocal accessible comme message manqué ; les indices indispensables ont aussi une voie de secours. Le refus ne change pas le camp du personnage.
5. La présence adresse aussi des messages aux gentils et aux ambigus. Recevoir sa voix n’est pas la preuve d’un camp méchant. Ne jamais annoncer au groupe qui a reçu quelle offre.
6. Les clips de tentation formulent une proposition. Ils ne changent pas secrètement un objectif de victoire. Leur acceptation éventuelle est définie par un message texte avec boutons et conséquences explicites.
7. Pour presence-tentation-02, prévoir à l’énigme 3 un volet de souvenirs dans le dossier noir, sans révélation de fin. L’ouvrir déclenche le souvenir promis si le marché a été accepté ; il reste accessible par la progression normale. Ce marché n’est pas nécessaire pour résoudre l’affaire.
8. Le bot ne prétend pas avoir entendu les discussions. Les déclenchements reposent sur une étape active, un bouton ou une preuve ouverte, jamais sur une interprétation supposée de la conversation dans la pièce.
9. Une pause suspend les messages et les appels fictifs programmés. Ne pas rejouer les introductions ni vider toute la file des événements après reprise.
10. rituel-echec fonctionne pour un mauvais rituel et pour un désaccord final : ne pas sélectionner la fin sur un jugement improvisé de l’IA. Un échec à une énigme intermédiaire ne déclenche pas la fin.

## Limites de ce lot

Ces dix clips constituent une base de production, pas toute la narration régulière d’une soirée. Les messages texte et images combleront les échanges entre les étapes ; des vocaux supplémentaires pourront être écrits après le premier test. Les objectifs ambigus et les énigmes exactes ne sont pas encore un paquet de jeu complet.

La bibliothèque d’administration actuelle accepte les images, pas encore l’audio. Les imports audio, leur stockage serveur et leur envoi Telegram restent à programmer. Conserver les futurs enregistrements séparément jusqu’à cette étape.
