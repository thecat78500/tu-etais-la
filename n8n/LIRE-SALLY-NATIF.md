# Workflow Sally — tout dans n8n

Importer `sally-memoire-n8n.json`. Ce fichier remplace les assemblages manuels de réception, inscription, historique et réponse texte IA. Il utilise les deux Data Tables déjà créées, pas le service Python que nous avons arrêté. Ne pas utiliser les anciens exports `serveur-jeu/01-reception-ia.json` et `02-expedition.json` pour cette méthode.

## Réglages après import

Importer dans le même projet n8n que `jeu_joueurs` et `jeu_messages` (le projet Personal de votre capture). Dans chaque nœud orange Data Table, choisir la table dans la liste ; ses valeurs, expressions et conditions sont déjà remplies.

| Nœud | Table à sélectionner |
|---|---|
| Ignorer un message deja recu | jeu_messages |
| Enregistrer le joueur | jeu_joueurs |
| Memoriser le message entrant | jeu_messages |
| Lire historique de ce joueur | jeu_messages |
| Memoriser la reponse envoyee | jeu_messages |

Choisir votre credential Telegram existant dans **Reception Telegram** et **Repondre sur Telegram**. Choisir votre credential OpenAI existant dans **Agent Sally - OpenAI** (Predefined Credential Type / OpenAI). Aucun credential supplémentaire, aucun mot de passe serveur, aucune clé à coller dans un nœud Code. Les trois sélections de credentials doivent être faites dans votre interface ; les identifiants locaux ne sont pas connus au moment de générer le fichier.

Vérifier après sélection des tables que les expressions des colonnes sont conservées. Le nœud joueurs doit n’envoyer que session_id, telegram_chat_id et prenom ; ne pas ajouter les champs role/camp/photo vides à cette opération.

## Tester

1. Désactiver l’ancien workflow Telegram ou arrêter son écoute de test : un seul webhook par bot. Ne pas exécuter deux copies en parallèle.
2. Enregistrer le nouveau workflow, cliquer sur Execute workflow, puis envoyer un **nouveau** message au bot, par exemple « Sally, tu m’entends ? ».
3. Vérifier une seule ligne joueur dans `jeu_joueurs`, puis une ligne `entrant/recu` et une ligne `sortant/envoye` supplémentaires dans `jeu_messages`.
4. Refaire un test avec « Qu’est-ce que je viens de te demander ? ». Sally reçoit les 12 derniers messages textuels confirmés de cette même conversation et de cette même session.
5. Une fois l’essai validé, activer/publier ce workflow pour qu’il réponde sans cliquer à chaque fois.

Le modèle est `gpt-4.1-mini`, dans le code **Preparer le contexte de Sally**, champ request.model. Si votre compte ne donne pas accès à ce modèle ou que l’API échoue, le bot envoie un texte de repli ; ouvrir la sortie du nœud OpenAI pendant un test pour vérifier l’erreur. Une bonne réponse de Sally avec `origine: ia` dans le nœud de validation confirme la génération ; `origine: repli` indique l’autre branche. Ces appels utilisent la facturation API associée à votre credential. Aucun appel réel n’a été fait pour tester ce fichier.

## Tables attendues

Toutes ces colonnes sont de type String, comme celles que vous avez créées. Ne pas créer les colonnes automatiques `id`, `createdAt`, `updatedAt`.

- `jeu_joueurs` : session_id, telegram_chat_id, prenom, role, camp, photo_file_id.
- `jeu_messages` : session_id, telegram_chat_id, sens, type_message, contenu, telegram_message_id, statut.

`telegram_chat_id` est conservé en texte. Le workflow préserve role/camp/photo déjà enregistrés. Le journal de sortie indique `envoye` seulement si Telegram retourne un identifiant de message pour le destinataire attendu. `erreur` signifie que l’envoi n’est pas confirmé : il peut s’agir d’un rejet ou d’une perte de confirmation. Ne pas relancer aveuglément l’envoi ; vérifier Telegram d’abord.

## Fonctionnement exact

Telegram → filtrage → vérification que le message n’existe pas → mise à jour du joueur → insertion du texte reçu → lecture de l’historique → préparation d’UN contexte → OpenAI → validation ou texte de repli → envoi Telegram → insertion de la réponse et de son statut.

Si la fréquence observée dépasse quatre messages entrants par minute, le nœud IF évite l’appel OpenAI et envoie un texte de repli. Il s’agit d’une protection simple pour les essais, pas d’un quota atomique en présence de plusieurs exécutions concurrentes. Les échecs OpenAI ne sont pas retentés automatiquement.

Les données restent dans le stockage persistant de votre instance n8n. Sauvegarder la base de n8n et sa clé de chiffrement selon votre installation ; les exports de workflows seuls ne sauvegardent ni les lignes des tables ni les credentials. Les sons/images déposés par WinSCP restent dans leurs dossiers du LXC. Pas de nouvelle base ou service à installer.

## Périmètre de cet export

- Session fixe `TEST-001`, seul le compte privé David `6644853325` est autorisé. Ce choix se change dans **Preparer le message**. Pour autoriser d’autres comptes privés de test, mettre `COMPTES_AUTORISES = []`. Ne pas ouvrir cet accès sans prévoir les coûts API et l’inscription à une vraie partie.
- Réponses texte uniquement. Le test vocal déjà créé peut être conservé comme fichier de référence, mais son ancien déclencheur ne doit pas rester actif sur le même bot. La sélection des vocaux, images, événements programmés et musique sera ajoutée ensuite.
- Aucun moteur d’énigmes ni nouvelle attribution de rôle/camp. Le contexte de Sally contient trois faits de démonstration, aucune solution. L’IA reçoit les champs rôle/camp du destinataire s’ils sont renseignés, jamais ceux d’une autre ligne.
- L’historique entier filtré est lu, puis seuls les 12 derniers textes sont transmis à l’IA. Cette lecture convient à des essais modestes ; pour un gros historique, ajouter une pagination/limite ordonnée compatible avec votre version n8n. L’IA ne se souvient donc pas nécessairement d’un détail plus ancien, même s’il reste dans la table.
- Les sorties de la table sont regroupées par un nœud Code exécuté une seule fois pour tous les éléments, ce qui évite une génération par ancienne ligne. Le code effectue aussi un second filtrage conversation/session avant envoi au fournisseur.
- Le modèle reçoit du texte du joueur, son historique autorisé et son rôle/camp, avec `store:false`. Ce réglage ne garantit pas une absence de toute rétention du fournisseur. Les exécutions automatiques ne sont pas conservées par cet export ; les données restent dans les tables prévues. Les tests manuels peuvent afficher leur contenu à l’administrateur n8n.
- La sortie structurée vérifie la forme et la longueur du texte, pas sa véracité. Sally n’a pas d’outils pour modifier la partie. Des essais de conversation restent nécessaires pour contrôler ses réponses.
- La recherche de doublon et l’insertion des messages sont deux opérations distinctes. Elles limitent les répétitions séquentielles, sans garantie transactionnelle en cas d’exécutions concurrentes ou de relance après panne. Un message entrant déjà enregistré ne déclenchera pas un nouvel envoi lors d’une réexécution identique : envoyer un nouveau message pour refaire un test. Aucun mécanisme de reprise automatique d’une partie n’est encore inclus.

Les colonnes restent visibles/modifiables dans l’interface n8n. Ne pas publier les conversations ni un export contenant des secrets. Vous pouvez supprimer les lignes TEST-001 une fois les essais terminés, après avoir arrêté le workflow.

## Vérification locale

Les fichiers de génération et de test se trouvent dans `natif/`. `node natif/test-workflow.cjs` vérifie les expressions Code, le cloisonnement, le regroupement de l’historique, le repli, l’échappement Telegram et la structure des connexions avec des réponses simulées. Ce contrôle ne remplace pas une exécution dans votre version de n8n avec vos tables et credentials.
