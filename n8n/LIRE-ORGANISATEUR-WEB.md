# Créer, lancer et arrêter les parties depuis le site

Le site ne demande plus à l’organisateur de saisir `/creer`, `/demarrer` ou `/fin`. Il envoie directement ses actions à un workflow n8n protégé. Les joueurs rejoignent toujours le bot et y consultent leurs informations privées.

Fichiers préparés localement, sans installation sur votre serveur ni publication GitHub automatique. Adresse configurée : **https://serteksa.ddns.net/webhook/tu-etais-la/organisateur**.

## 1. Garder les tables et le workflow Telegram

Les quatre tables restent `jeu_sessions`, `jeu_joueurs`, `jeu_messages`, `jeu_enigmes`. Aucun nouveau serveur ou table à créer pour les commandes web.

Le workflow Telegram **sally-parties-n8n.json** continue à recevoir les inscriptions et les messages des joueurs. Il doit être la version avec les cinq énigmes ; si votre installation est restée à la version rôles seuls, importer la version actuelle et sélectionner ses tables/credentials. Conserver un seul workflow Telegram actif.

La table `jeu_sessions` doit contenir les colonnes String `session_id`, `organisateur_chat_id`, `nombre_joueurs`, `scenario_id`, `statut` et **ecran_token** (ajoutée à l’étape de connexion du site). Si `ecran_token` n’existe pas encore, ajouter cette colonne String et laisser ses cellules vides. La table `jeu_enigmes` doit avoir les sept colonnes indiquées dans LIRE-ENIGMES-N8N.md.

## 2. Importer le workflow organisateur

Importer **sally-organisateur-n8n.json** dans le même projet n8n que les tables. Sélectionner :

| Table | Nœuds |
|---|---|
| jeu_sessions | Lire les parties ; Enregistrer la partie ; Relire les parties |
| jeu_joueurs | Lire les participants ; Enregistrer les roles ; Inscrire le participant ; Lire les places occupees ; Retirer inscription ; Relire les participants |
| jeu_messages | Verifier evenement Telegram ; Memoriser le message entrant |
| jeu_enigmes | Lire les enigmes ; Enregistrer les enigmes ; Relire les enigmes |

Les connexions et expressions sont déjà remplies. Ce workflow n’a ni déclencheur Telegram, ni envoi Telegram, ni agent IA : aucun credential du bot ou de ChatGPT à y sélectionner.

L’organisateur est fixé côté serveur à votre compte **6644853325**, dans le nœud **Normaliser Telegram**. Le navigateur ne peut pas choisir un autre identifiant. Vous comptez comme joueur lors de la création, comme auparavant ; vos autres joueurs rejoignent avec leurs propres comptes Telegram. Cette version fournit une seule console organisateur de confiance, pas un système de comptes administrateurs multiples.

## 3. Configurer une seule fois le code organisateur

La protection du webhook est **Header Auth**. C’est un credential n8n propre à l’organisation du jeu ; ce n’est ni votre clé OpenAI, ni votre mot de passe n8n, ni le code de la partie.

Vous pouvez faire cette configuration dans les deux onglets navigateur : n8n et le site.

1. Sur la page **ecran.html** mise à jour, ouvrir **Accès organisateur**, puis **Première installation : préparer mon code d’accès**.
2. Toucher **Générer mon code organisateur**. Le site génère un code aléatoire sur cet appareil et remplit le champ de connexion. Conserver ce code dans votre gestionnaire de mots de passe : il n’est pas enregistré automatiquement par le site.
3. Copier la **valeur pour n8n**, commençant par `Bearer `.
4. Dans n8n, ouvrir **Organisateur Webhook**. Authentication doit rester **Header Auth**. Dans le credential, choisir **Create new credential** et renseigner :

| Champ | Valeur |
|---|---|
| Nom du credential | Tu Etais La — Organisateur |
| Name | Authorization |
| Value | La valeur complète copiée, avec le préfixe Bearer et son espace |

Enregistrer le credential et le workflow, puis **activer/publier** le workflow organisateur. Il reste actif en même temps que le workflow Telegram.

Ne pas remplacer Header Auth par None : le code n8n vérifie l’authentification avant d’exécuter les actions. Les fichiers JSON distribués ne contiennent pas de code d’accès préinstallé. Le formulaire génère une proposition ; elle ne devient valide qu’après son enregistrement dans ce credential n8n.

Vérifier que la Production URL est :

```text
https://serteksa.ddns.net/webhook/tu-etais-la/organisateur
```

Le site fait des POST avec l’en-tête Authorization. Les origines autorisées préremplies sont GitHub Pages et les origines locales sur 8765. n8n doit être accessible par son HTTPS habituel ; le port SCP 2222 n’intervient pas. Si votre proxy bloque les requêtes OPTIONS, il faudra lui permettre de transmettre ces requêtes à n8n ; ne pas modifier la configuration sans avoir constaté cette erreur.

## 4. Mettre à jour GitHub Pages

Décompresser **site-tu-etais-la.zip**, puis déposer son **contenu** à la racine du dépôt GitHub `thecat78500/tu-etais-la` avec **Add file → Upload files**, et enregistrer les changements. Ne pas uploader uniquement le ZIP.

Le paquet public inclut les nouveaux contrôles de `ecran.html`, `ecran.js`, `ecran.css`, les dix affaires et leurs images. Il n’inclut pas les workflows n8n, les solutions ou un credential.

Après publication :

```text
https://thecat78500.github.io/tu-etais-la/ecran.html
```

Le lien « Ouvrir l’écran de partie connectée » de l’accueil mène aussi à cette page. Si le navigateur affiche encore l’ancien formulaire, recharger la page pour récupérer les fichiers publiés.

Pour configurer le code avant publication, cette même page peut être utilisée sur le serveur local déjà employé : `http://127.0.0.1:8765/ecran.html`. Les nouveaux contrôles doivent déjà y apparaître.

## 5. Jouer depuis le site

1. Saisir le code organisateur puis toucher **Se connecter comme organisateur**. Si une partie de votre compte est déjà ouverte, le site la reprend au lieu d’en créer une autre.
2. Choisir **4 à 10 joueurs** et le **scénario**. Toucher **Créer la partie**. La création est réelle dans n8n ; aucune commande à envoyer dans Telegram.
3. Copier le **lien d’inscription** et l’envoyer aux invités. Ceux-ci ouvrent le bot et appuient sur Démarrer. L’organisateur compte déjà comme joueur.
4. Suivre les prénoms et le nombre d’inscrits. **Lancer la partie** reste désactivé tant que l’effectif n’est pas complet. **Actualiser** permet une lecture immédiate ; sinon le site vérifie toutes les 15 secondes quand il est visible.
5. Toucher **Lancer la partie** : n8n génère les cinq énigmes et attribue les rôles/camps, puis ouvre les échanges. Les joueurs consultent `/role` et `/indice` sur leurs téléphones ; ils proposent les réponses par Telegram comme auparavant.
6. Toucher **Arrêter la partie**, puis confirmer. Les historiques sont conservés. Le formulaire de création redevient disponible pour choisir une autre affaire et un autre effectif.

Le site ne crée pas une deuxième partie si votre compte en a déjà une active. Effectif et scénario sont choisis avant la création ; pour en changer après création, arrêter cet accueil puis créer une nouvelle partie. Il n’existe pas encore de modification des paramètres d’une partie déjà ouverte.

**Fermer l’accès organisateur** ferme la console et efface le code saisi de cet onglet ; la partie continue. Recharger complètement la page impose de saisir à nouveau le code, conservé uniquement en mémoire pendant la connexion. Ne communiquer ce code qu’aux personnes autorisées à créer et terminer les parties du compte organisateur. Pour le révoquer, changer sa valeur dans le credential n8n.

Le mode **Afficher uniquement une partie déjà associée** reste disponible pour un deuxième écran. Il utilise l’ancien workflow `sally-ecran-n8n.json` et une clé `/ipad`, sans lui donner les commandes organisateur. **Ce mode n’est pas nécessaire pour piloter et afficher la partie depuis la console organisateur.**

## Limites et vérifications

Les messages spontanés, médias automatiques, pouvoirs, vote final et victoire des camps restent à raccorder. Les dix affaires conservent les mêmes cinq familles d’énigmes paramétrées. Cette mise à jour ajoute le pilotage web ; elle ne prétend pas terminer les mécaniques encore absentes.

Les commandes web utilisent le même code de planification et les mêmes écritures que le workflow Telegram. Seules les actions etat, creer, demarrer et fin sont acceptées. La réponse HTTP contient les informations collectives, sans rôles, camps, fragments privés ou solutions à venir. Il n’y a pas d’appel IA pour les commandes du site. Les lectures périodiques ne remplissent pas la table des messages ; les mutations y sont journalisées comme des commandes, séparées des conversations IA.

Pendant une demande, les boutons sont bloqués. Si la confirmation se perd, le site ne répète pas automatiquement l’action : il relit l’état et suspend les nouvelles commandes jusqu’à une lecture réussie. Un identifiant de requête permet d’écarter les répétitions séquentielles reçues par n8n. Ce n’est pas une transaction globale : éviter deux commandes simultanées depuis plusieurs onglets, ou en parallèle dans Telegram. Après une panne en milieu d’écriture, vérifier les tables avant une nouvelle tentative ; un message journalisé avant la panne peut ne pas avoir terminé son traitement.

`organisateur/test-organisateur.cjs` simule les chemins n8n, y compris inscriptions par le workflow Telegram, 4 et 10 joueurs, lancement conditionnel, arrêt, répétitions, identité fixe et sortie filtrée. `verify-ecran.cjs` vérifie les boutons dans Chromium aux formats iPad et mobile avec requêtes interceptées : aucune vraie partie du serveur n’a été créée pendant le développement. L’import, Header Auth et l’accès HTTPS/CORS doivent être vérifiés sur votre instance après installation.

Référence : [authentification des webhooks n8n](https://docs.n8n.io/integrations/builtin/credentials/webhook/).
