# Fins visuelles — plateau version 8

**Évolution suivante : version 9 préparée avant la publication de cette version 8.** Elle inclut ces cinq designs et les appels de conclusion de Sally/de l'entité. Publier directement les fichiers actuels ecran.html/plateau.js/plateau.css et vérifier `?v=9` / Plateau version 9. Enregistrements encore manquants ; guide dans audio-scripts/conclusions/LIRE-AVANT-ENREGISTREMENT.md.

Préparées le 25 octobre 2026 à la demande de l'utilisateur : adapter le design à ceux qui gagnent. **Préparation locale testée, publication non confirmée.** Aucun changement dans n8n, les règles, les votes ou les fichiers audio. Les images des cinq portes déjà publiées sont réutilisées.

| Issue | Ambiance | Décor de la porte |
|---|---|---|
| 1 : Sally revient | Lumière dorée, sortie de la maison | Porte entrouverte sur une lumière chaude |
| 2 : l'entité passe | Ombres rouges, menace au-delà du seuil | Porte entrouverte sur une lumière rouge |
| 3 : l'entité enfermée, Sally coincée | Bleu acier, silence froid | Verrous transversaux |
| 4 : tous enfermés | Rouille sombre, prison | Barreaux sur le seuil |
| 5 : rien ne change | Brume mauve, effacement | Porte désaturée qui s'estompe |

Le moteur fournit les gagnants dans `progression.portes.revelation`. L'interface utilise les champs `victoire`, `camp`, `prenom`, `objectif`, sans recalculer les règles. Elle affiche « Victoire des gentils », « Victoire de l'entité », le nom de l'ambigu gagnant, une victoire partagée ou « Aucun vainqueur » selon cette révélation. Un objectif ambigu n'est pas supposé atteint simplement parce que l'issue vaut 3 ou 5.

Les gagnants sont mis en évidence dans la liste des rôles. Le bouton « Voir les rôles et les objectifs » fait défiler le panneau et place le focus sur la révélation. Avant la fin : pas de thème de victoire, pas de nom de gagnant ni d'objectif. Retour à une phase de vote : thème final retiré.

## Installation, une étape à la fois

1. À la racine du dépôt GitHub, **Add file → Upload files** : republier `ecran.html`, `plateau.js`, `plateau.css` depuis `C:\Users\DavidDaCosta\Documents\Perso 2\Tu Etais La`, puis **Commit changes**. Attendre la confirmation utilisateur.
2. Ouvrir `https://thecat78500.github.io/tu-etais-la/ecran.html?v=8`, cliquer « Voir les portes et le résultat », vérifier le thème de l'issue actuelle et **Plateau version 8** dans Voix de la maison. Il n'est pas nécessaire de rejouer pour voir la fin de la partie encore conservée à l'écran.

Sauvegarde précédente : `sauvegardes/avant-fins-v8/`.

## Validation locale

`node verify-plateau.cjs` : cinq ambiances et bons noms de gagnants en paysage/portrait, victoire partagée entité/ambigu, issue 5 avec ou sans ambigu gagnant, accès aux rôles au clavier, nettoyage du thème avant un nouveau vote, chargement des cinq images et échappement des noms. `node verify-ecran.cjs` : parcours organisateur et réouverture du plateau après fin. Aucun appel au vrai n8n. Les cinq thèmes n'ont pas encore été vérifiés sur le site publié.

Captures : `captures/fin-1-paysage.png` à `captures/fin-5-paysage.png`, et variantes `-portrait.png`.
