# Sally avec AI Agent + ChatGPT

Fichier à importer : `sally-agent-n8n.json`. C’est la variante demandée avec les mêmes types/versions que votre exemple : `agent` v2.2 et `lmChatOpenAi` v1.2, modèle `gpt-4.1-mini`. Elle remplace le nœud HTTP OpenAI du précédent export et adapte le traitement de la réponse à `$json.output`.

## Réglages après import

1. Dans Reception Telegram et Repondre sur Telegram, sélectionner votre credential Telegram existant.
2. Dans le sous-nœud ChatGPT, vérifier le credential **OpenAi account**, dont la référence non secrète a été reprise de votre export. Le sélectionner à nouveau si n8n ne le retrouve pas.
3. Dans Enregistrer le joueur, choisir `jeu_joueurs`.
4. Dans Ignorer un message deja recu, Memoriser le message entrant, Lire historique de ce joueur et Memoriser la reponse envoyee, choisir `jeu_messages`. Les mappings et expressions sont déjà renseignés.
5. Désactiver l’ancien workflow ou son écoute Telegram, enregistrer le nouveau, lancer Execute workflow et envoyer un nouveau texte au bot.

Les Data Tables doivent être dans le même projet que le workflow. Aucun nouveau service ni credential de mémoire n’est utilisé. Ne pas activer en parallèle les différentes versions du workflow de réception sur le même bot.

## Mémoire et limites

L’historique reste stocké dans `jeu_messages` ; seuls les 12 derniers textes reçus/envoyés confirmés du même joueur et de la même session sont inclus dans le prompt de l’agent. Aucun Simple Memory supplémentaire n’est nécessaire. L’agent ne peut pas parcourir les autres tables ou choisir un autre destinataire.

Un outil Code Tool « Consulter le cadre du jeu » est connecté en lecture seule pour satisfaire la structure Tools Agent n8n. Il renvoie seulement trois faits de démonstration fixes. Il ne reçoit pas de secret, n’accède à aucune autre conversation, ne lit ni n’écrit de base et ne peut pas envoyer de message. Le journal des appels intermédiaires n’est pas inclus dans la sortie utilisateur.

Les instructions demandent un objet JSON `{"reply":"…"}` ; le nœud de validation accepte un objet ou une chaîne JSON sous `output`, vérifie sa forme et sa longueur, puis échappe le texte pour Telegram. Il n’y a pas de parser de schéma strict connecté à l’agent : une sortie invalide ou une erreur donne le texte de repli. La véracité du texte n’est pas vérifiée sémantiquement ; des essais narratifs sont encore nécessaires.

Le modèle reprend la température 0,6 de votre exemple. La longueur est limitée à 500 tokens par génération et les nouvelles tentatives du modèle sont désactivées (maxRetries=0). L’agent peut effectuer jusqu’à 3 itérations pour consulter l’outil et répondre ; une réponse peut donc nécessiter plusieurs appels au modèle. La limitation de fréquence observée dans l’historique est conservée. Les options se règlent directement dans le sous-nœud ChatGPT ; le champ `store:false` de l’ancien appel HTTP n’est pas transmis par cette variante. Les conditions de conservation du fournisseur et vos réglages n8n s’appliquent.

Toujours un test texte : session fixe TEST-001, seul David autorisé, pas de nouveaux rôles distribués, pas de moteur d’énigmes ni de vocaux programmés. Les colonnes role/camp/photo déjà présentes sont préservées. Le contrôle anti-doublon limite les répétitions séquentielles mais n’est pas une transaction atomique. Pas de nouvelle tentative automatique d’un envoi Telegram non confirmé.

Les données restent dans la base persistante de n8n, sauvegardée selon votre installation ; les fichiers restent sur le LXC via WinSCP. Les clés ne sont pas dans les scripts. L’export contient seulement une référence locale au credential déjà fourni, pas sa clé. Le système de mémoire Python arrêté ne sert pas ici.

Tests locaux : `node natif/test-agent.cjs` et `node natif/test-workflow.cjs`. Ils vérifient les connexions, expressions, sorties simulées, filtrage de l’historique, replis et échappement. Ils ne constituent pas une exécution sur votre instance n8n et n’appellent aucune API.

Référence : [n8n — AI Agent](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/).
