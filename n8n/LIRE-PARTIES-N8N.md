# Parties réelles — n8n uniquement

**Version actuelle : les cinq énigmes sont maintenant branchées.** Lire d’abord **LIRE-ENIGMES-N8N.md** pour créer `jeu_enigmes`, sélectionner ses deux nœuds et utiliser `/enigme`, `/indice`, `/repondre NUMERO REPONSE`, `/carnet`. Les indications ci-dessous relatives à des énigmes encore absentes décrivent l’étape précédente. Le guide des énigmes fait référence pour cette mise à jour ; les étapes de création/inscription ci-dessous restent valables.

Importer `sally-parties-n8n.json`. Ce workflow étend la version AI Agent + ChatGPT déjà testée par David. Aucun serveur de mémoire ni nouveau transfert de fichiers n’est nécessaire ; les sons et images restent sur le LXC via WinSCP. Ne pas activer en parallèle l’ancien workflow TEST-001.

## 1. Créer une seule table supplémentaire

Dans le même projet n8n que les deux tables existantes, créer **jeu_sessions**, avec ces cinq colonnes de type **String** :

| Colonne | Valeur conservée |
|---|---|
| session_id | Code d’accès de la partie |
| organisateur_chat_id | Identifiant Telegram de son organisateur |
| nombre_joueurs | Nombre attendu, de 4 à 10, organisateur compris |
| scenario_id | Référence de l’affaire, de 1 à 10 |
| statut | accueil, en_cours ou terminee |

Laisser les lignes vides ; n8n conserve ses colonnes automatiques id/createdAt/updatedAt. Les tables `jeu_joueurs` et `jeu_messages` déjà créées ne changent pas de structure. `type_message` peut maintenant contenir `commande` pour les commandes/notifications d’accueil, qui restent journalisées mais ne sont pas envoyées à l’IA comme des échanges narratifs.

## 2. Importer et sélectionner les tables

Importer le JSON dans ce même projet. Les expressions et connexions sont déjà remplies. Choisir les Data Tables dans les listes de ces nœuds :

| Table | Nœuds |
|---|---|
| jeu_sessions | Lire les parties ; Enregistrer la partie |
| jeu_joueurs | Lire les participants ; Inscrire le participant ; Lire les places occupees ; Retirer inscription ; Enregistrer les roles |
| jeu_messages | Verifier evenement Telegram ; Memoriser le message entrant ; Lire historique de ce joueur ; Memoriser la reponse envoyee |

Choisir le credential Telegram existant dans **Reception Telegram** et **Repondre sur Telegram**. Vérifier **OpenAi account** dans le sous-nœud **ChatGPT** : la référence à votre credential est reprise comme dans la version qui fonctionne déjà. Aucun jeton à coller dans les scripts.

Dans **Planifier la partie**, l’organisateur autorisé par défaut est votre compte `6644853325`. Les autres comptes privés peuvent rejoindre les parties, mais ne peuvent pas en créer. Pour ajouter un organisateur de confiance, ajouter son identifiant dans la liste ORGANISATEURS du code.

Arrêter/désactiver l’ancien workflow avant de lancer celui-ci : Telegram ne dispose que d’un webhook actif par bot. Enregistrer puis **activer/publier** le nouveau workflow pour recevoir successivement les messages de tous les participants. Les essais manuels n’écoutent souvent qu’un événement à la fois.

## 3. Première partie

Depuis votre compte :

```text
/creer 4 1
```

Cela crée une partie de quatre personnes (vous compris), référence affaire 1. Le bot renvoie un code et un lien comme :

```text
https://t.me/tu_etais_la_maison_bot?start=MCODE123
```

Les trois autres personnes ouvrent ce lien et appuient sur **Démarrer**. Elles peuvent aussi ouvrir le bot et envoyer :

```text
/rejoindre MCODE123 Alice
```

Remplacer le code par le vrai code reçu, et Alice par le prénom/pseudo choisi. Avec le lien seul, le prénom du compte est utilisé. Chaque inscription confirmée crée une ligne dans jeu_joueurs rattachée au code de partie. Le bot réserve une place à l’organisateur.

Contrôler :

```text
/statut
```

Quand les quatre sont inscrits, l’organisateur envoie :

```text
/demarrer
```

Le statut devient `en_cours`. Prévenir les joueurs à table : **cette version confirme le lancement à l’organisateur, elle ne diffuse pas encore une notification de lancement à tous les invités**. Chaque invité peut vérifier `/statut`, puis écrire à Sally. Avant le lancement, les messages donnent seulement une réponse d’attente, sans appel IA.

Pour tester dix joueurs, `/creer 10 1` ; le lancement attend les dix comptes distincts. Au lancement, un rôle distinct et un camp sont attribués à chacun et enregistrés dans `jeu_joueurs` avant de passer la session en cours. Chaque joueur envoie `/role` en privé pour consulter sa fiche, sans appel IA. Un second `/demarrer` ne refait pas le tirage. Les conversations sont possibles dès que la partie est lancée ; les énigmes restent à raccorder.

| Joueurs | Gentils | Méchants | Ambigus |
|---|---|---|---|
| 4 | 2 | 1 | 1 |
| 5 | 3 | 1 | 1 |
| 6 | 3 | 2 | 1 |
| 7 | 4 | 2 | 1 |
| 8 | 4 | 2 | 2 |
| 9 | 5 | 2 | 2 |
| 10 | 5 | 3 | 2 |

Rôles : Médium, Veilleur, Gardien, Revenant, puis Archiviste, Écho, Cartographe, Porteur, Scribe, Témoin selon l’effectif. Le rôle est indépendant du camp ; les quatre premiers sont toujours présents. Les fiches sont encore narratives : pouvoirs, objectif individuel des ambigus et victoire ne sont pas automatisés.

**Mise à jour d’une partie déjà lancée :** le workflow ne modifie pas les rôles d’une session en cours. Terminer le test avec `/fin`, puis créer une nouvelle partie et recopier les trois lignes `SIM-01`, `SIM-02`, `SIM-03` avec son nouveau code. Après `/demarrer`, vérifier les quatre rôles/camps dans la table et envoyer `/role` depuis le compte réel. Les lignes SIM occupent des places et reçoivent une attribution en base, sans envoi Telegram. Pour quatre vrais joueurs, utiliser quatre comptes réels.

## 4. Quitter et terminer

- `/quitter` : retire son inscription pendant l’accueil. Si l’organisateur quitte, l’accueil entier est fermé ; les inscriptions sont conservées pour l’historique.
- `/fin` : seul l’organisateur peut terminer sa partie. Les nouveaux échanges avec Sally sont bloqués, et les anciens messages restent dans la table.
- `/demarrer CODE`, `/fin CODE`, `/quitter CODE` : permettent de désigner explicitement une partie ; un code inconnu ne modifie aucune autre partie.
- `/statut` : indique sa partie actuelle, le nombre d’inscrits et le statut. Il ne révèle pas les rôles ou camps.

Après `/fin`, `/creer 4 2` crée un nouveau code. Les mêmes personnes peuvent rejoindre cette nouvelle partie et auront une nouvelle ligne joueur. Les anciens échanges ne sont pas intégrés au nouveau contexte IA. Les anciennes lignes TEST-001 ne sont pas supprimées et ne sont plus considérées comme une inscription active.

## Séparation des informations

Chaque message est enregistré avec son session_id et son telegram_chat_id. L’IA reçoit seulement les 12 derniers textes confirmés du même joueur dans la partie actuelle, ainsi que son propre rôle/camp si vous les avez renseignés. Les commandes d’inscription ne sont pas incluses. Le code réalise un deuxième filtrage du contexte avant d’appeler le modèle.

Les consignes de Sally ont été renforcées : elle peut se souvenir qu’un joueur a parlé d’un objet, mais ne doit pas traiter ce propos comme un indice officiel, lui inventer un lien avec un lieu ou le qualifier automatiquement de preuve importante. Il s’agit d’une consigne narrative, pas d’une validation sémantique parfaite : refaire le test de l’objet et vérifier la formulation sur l’instance réelle.

Le serveur de mémoire Python reste arrêté. Les Data Tables font partie du stockage de n8n : sauvegarder la base de n8n en plus des fichiers médias. Un export du workflow n’inclut pas les lignes des tables.

## Limites de cette étape

Ce workflow gère les parties, les inscriptions, l’attribution des rôles/camps et les conversations séparées. Il ne génère pas les cinq énigmes, ne décide pas les victoires et ne relie pas l’iPad au code de partie. `scenario_id` est une référence de préparation ; le prompt actuel reste le cadre de conversation de démonstration, pas les dix scénarios complets. Les vocaux, images et messages spontanés ne sont pas branchés dans cette version.

Les opérations Data Tables ne forment pas une transaction globale. Un contrôle est fait après insertion pour les places : une place est réservée à l’organisateur, les invités sont admis selon l’ordre réel de leurs lignes, et une inscription excédentaire est retirée. Les doublons d’une même personne sont décomptés comme une seule place. Ne pas activer plusieurs copies du workflow.

Il reste des cas de panne/concurrence à traiter pour une exploitation continue : deux créations simultanées d’un même organisateur, deux inscriptions du même compte dans des parties différentes, arrêt entre le journal et l’écriture d’état. L’anti-doublon est séquentiel, pas une garantie de traitement exactement une fois. Après une panne, vérifier les tables plutôt que relancer un ancien message aveuglément. Un message IA déjà en cours peut arriver après `/fin`.

Les tables de sessions et de participants sont lues intégralement pour planifier les commandes. Cela convient aux premiers essais de petites parties, pas à une très grande archive : prévoir une lecture paginée/ciblée avant de monter en charge. Le cloisonnement fourni au modèle reste strictement appliqué par session/destinataire, même si le workflow administrateur peut lire les tables globales.

La limite de fréquence et les précautions de confirmation Telegram de la version précédente sont conservées. Le modèle est facturé via votre credential API habituel ; aucun appel réel n’a été fait durant le développement.

## Vérifications fournies

`node sessions/test-sessions.cjs` simule le chemin principal des nœuds Code/Data Table/If et des réponses Telegram/IA pour vérifier : création, liens d’inscription, capacités, contrôles organisateur, état d’accueil, lancement, journal, cloisonnement, nouvelle partie et fin. Il teste aussi le classement des places après écritures et la structure des connexions. Ce n’est pas une exécution n8n réelle ; l’import et un essai avec quatre comptes restent à faire sur votre instance.
