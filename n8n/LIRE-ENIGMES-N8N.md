# Mise à jour : cinq énigmes renouvelables

Le workflow `sally-parties-n8n.json` reprend les rôles et les conversations déjà validés. Tout reste dans n8n ; les médias restent sur le LXC. Aucun service supplémentaire à installer.

## 1. Créer une seule nouvelle Data Table

Nom : **jeu_enigmes**. Créer ces **sept colonnes, toutes String** :

```text
session_id
etape
titre
enonce
solution
indices_json
statut
```

Laisser la table vide. Conserver les colonnes automatiques n8n. Les trois tables existantes ne changent pas. `indices_json` est simplement un texte JSON écrit par le workflow ; ne rien saisir à la main.

Cette table contient les solutions privées : elle appartient à l’administration n8n. Ne pas la publier sur GitHub et ne pas l’afficher aux joueurs.

## 2. Importer la nouvelle version

Désactiver le workflow précédent, importer `sally-parties-n8n.json`, puis sélectionner les tables :

| Table | Nœuds |
|---|---|
| jeu_sessions | Lire les parties ; Enregistrer la partie |
| jeu_joueurs | Lire les participants ; Inscrire le participant ; Lire les places occupees ; Retirer inscription ; Enregistrer les roles |
| jeu_messages | Verifier evenement Telegram ; Memoriser le message entrant ; Lire historique de ce joueur ; Memoriser la reponse envoyee |
| **jeu_enigmes** | **Lire les enigmes ; Enregistrer les enigmes** |

Credential Telegram habituel : **Reception Telegram** et **Repondre sur Telegram**. Credential OpenAI existant : **ChatGPT**. Enregistrer et activer/publier cette version seule.

Créer une nouvelle partie pour bénéficier des cinq énigmes. Une ancienne partie en cours n’est pas modifiée rétroactivement : elle doit être terminée avec `/fin` avant un nouveau `/creer`.

## 3. Essai avec les joueurs simulés

Depuis Telegram, terminer la partie de test précédente :

```text
/fin
```

Créer une nouvelle partie :

```text
/creer 4 1
```

Dans `jeu_joueurs`, ajouter trois **nouvelles** lignes `SIM-01`, `SIM-02`, `SIM-03` avec le **nouveau code de partie**, prénoms Alice, Bob, Claire ; laisser rôle/camp/photo vides. Conserver les anciennes lignes pour l’historique.

```text
/demarrer
```

Vérifier : quatre rôles/camps et **cinq lignes** dans `jeu_enigmes` pour le nouveau code. Ne pas modifier les solutions.

```text
/role
```

```text
/enigme
```

```text
/indice
```

Le compte réel reçoit son indice. Les SIM ne sont pas des comptes Telegram : pour jouer seul en simulation, lire dans `indices_json` les trois fragments associés à SIM-01/02/03. Cette consultation est réservée à l’administrateur pendant le test ; avec de vrais joueurs, chacun reçoit seulement son fragment en envoyant `/indice`.

Après avoir réuni les indices, envoyer le numéro et la réponse, par exemple :

```text
/repondre 1 VOTRE REPONSE
```

Remplacer `VOTRE REPONSE` par ce que vous avez déduit. Le groupe peut choisir n’importe quel participant pour saisir la réponse. Une erreur laisse l’étape inchangée ; aucune tentative n’est éliminatoire. Une bonne réponse ajoute la solution au carnet et ouvre la suivante.

```text
/carnet
```

```text
/enigme
```

```text
/indice
```

Recommencer jusqu’à `/repondre 5 ...`. Le numéro est obligatoire : une ancienne réponse répétée ne valide pas une nouvelle étape. Accents, espaces et ponctuation sont ignorés pour comparer la réponse ; les mots et leur ordre doivent correspondre. Les heures sont demandées en HH:MM sur 24 heures.

## Les cinq étapes

| Étape | Déduction | Ce qui varie |
|---|---|---|
| 1. Le nom effacé | Réunir quatre lettres positionnées | Nom d’un personnage des archives, destinataires des fragments |
| 2. Les quatre marques | Retrouver un ordre unique à partir de contraintes | Ordre des marques et attribution des contraintes |
| 3. L’objet d’ancrage | Croiser matière, température et gravure avec un registre | Associations des propriétés et objet correct |
| 4. L’heure derrière le mur | Corriger une horloge grâce à un événement commun | Heures, avance ou retard de la pendule |
| 5. La formule du seuil | Combiner les quatre réponses précédentes | Formule issue de cette partie |

À partir de cinq joueurs, certains fragments ont plusieurs détenteurs. Chacun reçoit un fragment, et les quatre informations nécessaires restent disponibles collectivement. Les preuves officielles sont les textes générés ; les images ne servent pas à mesurer un détail approximatif ou à inventer un indice.

Les dix affaires fournissent leur titre et leurs textes d’ambiance à ces **mêmes cinq familles d’énigmes**. Les données et leur distribution sont tirées à chaque lancement. Ce n’est pas dix mécaniques différentes ; les règles de résolution s’apprennent d’une partie à l’autre et certains paramètres peuvent revenir. Ce premier ensemble est volontairement simple pour tester le déroulement avant d’ajuster la difficulté.

## Ce qui fonctionne et ce qui reste à raccorder

Progression commune persistante, accès privé aux indices, carnet des réponses validées, validation par code sans appel IA. Sally reçoit le contexte de l’affaire, l’énoncé actif, l’indice du seul interlocuteur et le carnet partagé. Les autres fragments et les solutions non validées ne sont pas transmis au modèle. Un joueur peut toutefois révéler lui-même son fragment dans sa conversation.

Les joueurs demandent les messages avec les commandes : **pas encore de diffusion automatique, de messages programmés, de liaison iPad ni d’envoi de médias**. Après la cinquième énigme, le rituel est prêt, mais le vote final, les pouvoirs et la victoire de chaque camp restent à développer. Ne pas présenter ce test comme une partie complète avec gagnants calculés. `/fin` ferme manuellement la session.

Les Data Tables ne forment pas une transaction globale. Ne pas lancer plusieurs copies du workflow ; éviter deux `/demarrer` simultanés. Après une panne pendant un lancement, vérifier l’état des tables avant une relance. Les réponses validées ne font qu’avancer l’état d’une étape ; deux réponses correctes simultanées peuvent encore produire deux confirmations. Un `/fin` n’annule pas une exécution déjà engagée. Sauvegarder la base n8n : l’export JSON ne contient pas les parties.

Vérification locale : `sessions/test-sessions.cjs` simule les nœuds Code/Data Table/If et Telegram/IA. Les cinq réponses sont reconstruites à partir des indices sur 70 variantes (10 affaires × effectifs 4–10), avec contrôle d’unicité pour les marques et l’objet, progression, commandes privées, erreurs, carnet et absence de solutions futures dans le contexte IA. L’import et le déroulement réel sur votre instance n8n restent à tester.
