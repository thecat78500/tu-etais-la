# Relier le site GitHub à n8n

**Nouvelle version : le site possède maintenant les commandes organisateur.** Lire d’abord **LIRE-ORGANISATEUR-WEB.md** pour créer, lancer et arrêter les parties depuis le navigateur. Le parcours `/ipad` décrit ci-dessous sert désormais au mode facultatif de second écran en lecture seule.

Adresse configurée : **https://serteksa.ddns.net**. Le site connecté utilise **ecran.html** ; la page d’archives précédente reste une démonstration distincte, avec un lien vers cet écran.

Les fichiers et workflows ont été préparés et testés localement avec des réponses simulées. Ils ne sont pas encore installés sur votre instance n8n ni publiés sur GitHub par cette mise à jour.

## 1. Ajouter une colonne dans n8n

Dans la Data Table **jeu_sessions**, ajouter :

```text
ecran_token
```

Type : **String**. Laisser les cellules vides. Les cinq colonnes existantes restent présentes.

La table `jeu_enigmes` à sept colonnes est nécessaire : voir LIRE-ENIGMES-N8N.md si elle n’a pas encore été créée. Aucun autre service, compte API ou transfert de média à installer.

## 2. Mettre à jour le workflow Telegram

Désactiver la version Telegram précédente et importer **sally-parties-n8n.json**. Sélectionner vos tables et credentials comme précédemment :

| Table | Nœuds |
|---|---|
| jeu_sessions | Lire les parties ; Enregistrer la partie |
| jeu_joueurs | Lire les participants ; Inscrire le participant ; Lire les places occupees ; Retirer inscription ; Enregistrer les roles |
| jeu_messages | Verifier evenement Telegram ; Memoriser le message entrant ; Lire historique de ce joueur ; Memoriser la reponse envoyee |
| jeu_enigmes | Lire les enigmes ; Enregistrer les enigmes |

Telegram : **Reception Telegram** et **Repondre sur Telegram**. OpenAI existant : **ChatGPT**. Le nœud Enregistrer la partie écrit maintenant aussi `ecran_token` ; vérifier que la colonne apparaît dans son mapping. Activer/publier cette version seule pour la réception Telegram.

## 3. Importer le workflow de lecture du site

Importer **sally-ecran-n8n.json** dans le **même projet n8n** que les tables. Choisir :

| Nœud | Data Table |
|---|---|
| Ecran session | jeu_sessions |
| Ecran participants | jeu_joueurs |
| Ecran enigmes | jeu_enigmes |

Aucun credential Telegram ou OpenAI dans ce workflow. Il ne contient qu’un Webhook, des lectures de tables et une réponse filtrée.

Activer/publier le workflow. Il doit rester actif **en même temps** que le workflow Telegram : il a son propre déclencheur HTTP, sans second déclencheur Telegram.

Dans **Ecran Webhook**, vérifier **Production URL** :

```text
https://serteksa.ddns.net/webhook/tu-etais-la/ecran
```

Méthode **POST**. Réponse **Using Respond to Webhook Node**. L’URL de test `/webhook-test/` n’est pas celle du site. Une ouverture de cette adresse dans la barre du navigateur enverrait GET, donc ne constitue pas un test valide.

Les origines autorisées sont préremplies : `https://thecat78500.github.io`, `http://127.0.0.1:8765`, `http://localhost:8765`. Le script vérifie aussi l’origine, le code de partie et la clé d’association. Les origines locales servent uniquement aux essais du site local. Aucun credential administrateur n8n n’est placé dans GitHub.

Si n8n affiche une Production URL différente, ne pas modifier au hasard Nginx ou le routeur : relever cette URL pour corriger le lien dans `ecran.js`. La redirection HTTPS doit déjà permettre d’atteindre les webhooks n8n. L’ancien port SCP 2222 ne participe pas à cette connexion.

## 4. Publier les fichiers web

Le dossier **publication-github** et l’archive **site-tu-etais-la.zip**, placés à côté du dossier du jeu, contiennent uniquement les fichiers publics nécessaires.

Décompresser l’archive sur le PC. Dans le dépôt GitHub **thecat78500/tu-etais-la**, utiliser **Add file → Upload files**, puis déposer le **contenu** du dossier extrait à la racine du dépôt et enregistrer les changements. Ne pas déposer seulement le ZIP : GitHub Pages doit recevoir les fichiers HTML/JS/CSS et le dossier assets.

Les fichiers publics ajoutés sont `ecran.html`, `ecran.css`, `ecran.js` et `catalogue-affaires.json`. L’accueil `index.html` contient le lien vers cet écran. Les images des dix affaires et l’introduction MP3 commune sont incluses. L’archive ne contient pas les workflows, les solutions, la bibliothèque vocale privée ou les tables.

Après la publication GitHub Pages, ouvrir :

```text
https://thecat78500.github.io/tu-etais-la/ecran.html
```

## 5. Associer l’iPad à une partie

Créer une nouvelle partie dans Telegram si la partie en cours n’a pas été générée par la version à cinq énigmes. Par exemple, quatre joueurs et affaire 8 :

```text
/creer 4 8
```

Faire rejoindre les invités par le lien Telegram. Sur l’iPad :

1. Ouvrir **ecran.html** et toucher **Préparer l’association**.
2. Copier la commande `/ipad ...` produite par la page.
3. Envoyer cette commande au bot **depuis le compte organisateur**, dans sa conversation privée.
4. Ouvrir sur l’iPad le lien de partie renvoyé par le bot. Autre possibilité : saisir le code de partie dans le formulaire resté ouvert, puis toucher **Afficher la partie** ; la clé y est déjà renseignée sur cet appareil.

Le lien doit être réservé à votre table. Il donne accès aux prénoms, à l’affaire, à l’énoncé actif et au carnet commun. Il ne donne aucun accès administrateur n8n, aux camps, aux rôles ou aux conversations privées.

Une clé aléatoire de 32 octets est générée par le navigateur ; elle est enregistrée dans `jeu_sessions` seulement après validation du compte organisateur dans Telegram. Le site garde l’association dans le stockage de l’onglet et retire la clé de la barre d’adresse après lecture du lien. Recharger l’onglet reprend l’association ; un nouvel appareil doit ouvrir le lien fourni par le bot. Ne pas diffuser ce lien dans une publication publique.

Quand les places sont occupées, l’organisateur envoie :

```text
/demarrer
```

Sur chaque téléphone : `/role`, puis `/indice`. L’iPad affiche `/enigme` et les découvertes communes ; un joueur envoie `/repondre 1 ...` dans Telegram. Le site se rafraîchit toutes les **15 secondes**, uniquement quand l’onglet est visible. Le bouton **Actualiser** permet une lecture immédiate. Chaque lecture crée une exécution du workflow écran, sans appel IA.

Pour changer d’affaire, terminer avec `/fin`, puis créer une nouvelle partie : `/creer 4 1` à `/creer 4 10`. Le catalogue du site copie la bonne commande pour l’effectif et l’affaire sélectionnés. L’iPad reprend l’affaire choisie dans n8n, il ne la modifie pas directement.

## Révoquer ou terminer

```text
/ipad couper
```

Cette commande révoque la clé de votre partie sans arrêter Telegram. Une nouvelle association remplace aussi l’ancienne clé. `/fin` révoque la clé en terminant la partie. Le prochain rafraîchissement de l’iPad refusera l’accès.

**Déconnecter l’écran** efface uniquement l’association de cet onglet ; cela ne révoque pas le lien sur les autres appareils. Utiliser `/ipad couper` pour le révoquer côté n8n.

## Les dix scénarios et les limites actuelles

Les dix affaires figurent dans le catalogue avec leur titre, illustration et introduction écrite. Le workflow génère pour chacune les cinq familles d’énigmes, avec paramètres et distribution renouvelés. Le catalogue public n’inclut pas les éléments de résolution privés du scénario.

Il reste à développer les mécaniques propres à chaque affaire si l’on souhaite dix structures entièrement différentes, le vote final, les victoires, les pouvoirs et les messages spontanés. Les autres fichiers audio n’ont pas été créés ni synchronisés automatiquement : seule l’introduction commune de Sally est disponible dans cet écran. Le site ne joue pas automatiquement tous les sons d’une affaire.

La lecture n8n utilise des champs explicitement autorisés : les solutions à venir, `indices_json`, identifiants Telegram, camps, rôles, portraits privés et clé ne font pas partie de la réponse. Les réponses déjà validées sont communes et apparaissent dans le carnet. Les textes sont affichés comme texte, pas interprétés comme HTML.

Le workflow ne constitue pas une API de gestion des parties : il ne fait aucune écriture. Il n’existe pas de transaction globale entre les deux workflows. Une révocation pendant une lecture déjà engagée peut laisser arriver sa dernière réponse ; une erreur réseau est signalée pour éviter de présenter une ancienne progression comme actualisée. Le stockage automatique des exécutions est désactivé dans les exports ; les tables restent sauvegardées avec la base n8n.

## Vérifications locales

- `n8n/sessions/test-sessions.cjs` : parties, rôles, cinq énigmes, association réservée au propriétaire, remplacement et révocation de clé.
- `n8n/ecran/test-ecran.cjs` : accès code/clé/origine, filtres par session et exclusion des informations privées de la réponse.
- `verify-ecran.cjs` : affichage dans Chromium iPad 1194×834 et mobile, dix affaires/images, carnet, reprise après rechargement, lien d’association et refus d’accès. Les requêtes au vrai n8n sont interceptées par le test.

La connexion réelle HTTPS/CORS et l’import des workflows doivent encore être vérifiés sur votre serveur après installation. Sources de configuration : [Webhook n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) et [Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/).
