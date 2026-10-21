# Stockage des médias — serveur du bureau sous Proxmox

## Architecture confirmée le 18 octobre 2026

Le site sera hébergé sur GitHub Pages. n8n fonctionne avec Docker sur un serveur Proxmox au bureau et dispose déjà d’un accès HTTPS depuis l’extérieur. Le VPS envisagé initialement est remplacé par ce serveur : les mentions « VPS » ci-dessous désignent désormais l’hôte Docker dans Proxmox (VM ou conteneur à préciser), et non le système de fichiers de l’hyperviseur.

Le site GitHub Pages appellera une API média authentifiée en HTTPS. Cette API stockera les fichiers sur un volume persistant accessible à n8n. L’accès HTTPS existant à n8n ne crée pas automatiquement cette API. Configurer les origines CORS avec l’origine exacte du site ; CORS ne remplace pas l’authentification. Aucun jeton administrateur ou Telegram ne doit être publié dans le dépôt ou le JavaScript. Les fichiers privés et leurs solutions restent côté serveur.

Il reste à obtenir l’adresse HTTPS publique de n8n et le Compose existant avec ses secrets masqués pour adapter le raccordement. Le proxy, le domaine GitHub Pages et les montages réels ne sont pas encore connus. Aucun déploiement ni import distant n’a été réalisé.

Architecture retenue pour une installation n8n existante dans Docker. Ce document et le fragment Compose ne déploient rien et ne modifient pas le serveur. Le studio utilise encore IndexedDB tant que l’API d’import n’est pas installée et branchée.

## Circuit retenu

Studio iPad/ordinateur → API d’import authentifiée en HTTPS → dossier persistant sur le VPS → n8n → Telegram.

Conserver les originaux sur le VPS. Après un premier envoi via sendVoice, conserver message.voice.file_id avec l’identifiant du bot, le type d’envoi et l’empreinte du fichier. Les envois suivants peuvent réutiliser ce file_id avec le même bot. Une nouvelle version du son invalide l’association courante, sans écraser silencieusement l’ancienne.

## Dossier hôte proposé

```text
/srv/tu-etais-la/media/
  audio/
  images/
  musique/
  effets/
  catalogue/
```

Monter ce dossier dans le conteneur n8n à /files/tu-etais-la, en lecture seule. Le futur service d’import dispose d’un montage en écriture sur ce même dossier. Le studio n’accède pas directement au système de fichiers du VPS.

Ne pas placer ces médias dans les fichiers temporaires des exécutions n8n. Sauvegarder les fichiers ET leur catalogue hors du VPS. Un volume persistant protège contre le remplacement d’un conteneur, pas contre la perte du serveur.

## Catalogue partagé

Chaque média est identifié par un identifiant stable (par exemple A08_SALLY_03_enigme), sa version (clean ou phone) et une empreinte SHA-256 du contenu. La combinaison identifiant/version pointe vers une révision immutable stockée sur disque. Les noms reçus du navigateur ne sont jamais utilisés directement comme chemins de fichiers.

Champs utiles : media_id, version, revision, sha256, relative_path, mime_type, bytes, duration_seconds, scenario_id, title, updated_at. Pour chaque bot et type d’envoi, un cache associe sha256 au telegram_file_id. Les images envoyées comme photos et les fichiers envoyés comme documents/vocaux ne partagent pas automatiquement le même identifiant d’envoi.

Stockage des métadonnées à choisir d’après le stack existant : table PostgreSQL si la base de l’application est disponible, ou SQLite dans le volume du service média. Ne pas écrire dans les tables internes de n8n.

## API d’import à développer

- Authentifier l’organisateur ; ne pas laisser un webhook d’upload public sans contrôle.
- Recevoir le fichier et l’identifiant du script choisi, puis vérifier taille, format et identifiant autorisé.
- Enregistrer une révision, mettre à jour le catalogue et renvoyer la confirmation seulement après écriture durable.
- Donner au studio la liste des fichiers réellement présents et leur état de préparation Telegram.
- Fournir une lecture authentifiée pour l’iPad. Les pistes privées ne doivent pas devenir un répertoire public listable.
- Garder les identifiants du bot et de n8n côté serveur. Aucun secret de service dans le JavaScript du navigateur.
- Permettre de transférer les imports IndexedDB existants depuis le navigateur d’origine ; ils ne sont pas automatiquement présents sur le serveur.

## Envoi n8n

1. Le moteur demande media_id + version + destinataire Telegram autorisé pour la session.
2. Résoudre la révision dans le catalogue ; ne pas accepter un chemin libre fourni par un joueur.
3. Si le cache contient un file_id valide pour le même bot et le bon type, envoyer cet identifiant.
4. Sinon lire le fichier dans le volume via Read/Write Files from Disk puis le téléverser à sendVoice/sendPhoto/sendAudio selon le type.
5. Enregistrer l’identifiant retourné par Telegram. Un cache refusé entraîne un nouveau téléversement depuis l’original, avec une seule tentative de repli contrôlée.
6. Limiter le débit et traiter les réponses 429 avec retry_after. Utiliser une clé d’événement pour éviter de doubler un message si le workflow est relancé.

La mise en cache accélère la réutilisation et réduit les téléversements ; elle ne garantit pas une livraison instantanée sur le téléphone. Précharger les médias par un envoi dans une conversation de préparation dédiée seulement après autorisation explicite de l’utilisateur.

Les vocaux privés ne sont jamais envoyés au groupe de la partie pour les précharger.

## Vérifications Docker avant application

- Obtenir le service n8n réel, les volumes existants, le réseau et le reverse proxy. Le fragment suppose que le service s’appelle n8n ; adapter si nécessaire.
- Préserver la base, le volume .n8n, les identifiants et le domaine existants.
- Préparer les propriétaires/permissions du dossier pour les utilisateurs réels des conteneurs.
- Pour les versions qui restreignent les lectures, ajouter /files/tu-etais-la à N8N_RESTRICT_FILE_ACCESS_TO en conservant les autres répertoires nécessaires. Ne pas remplacer aveuglément sa valeur.
- Valider le Compose fusionné avant toute recréation du conteneur et prévoir une sauvegarde.
- Le service d’import et son accès HTTPS restent à créer ; le montage seul n’ajoute aucune fonction d’import au navigateur.

Sources officielles :
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.readwritefile/
- https://core.telegram.org/bots/api#sending-files
