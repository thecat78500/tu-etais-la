# Raccorder le Studio au serveur du bureau

Implémentation prête à tester, non déployée. Les vocaux importés dans IndexedDB peuvent être transmis au service média par le nouveau panneau du Studio. Cette étape concerne les enregistrements audio ; la galerie d’images n’est pas encore raccordée. La sauvegarde GitHub n’est pas encore configurée. Une copie dans un navigateur ne constitue pas une sauvegarde durable indépendante.

## Installation à adapter au Compose existant

1. Copier le projet sur l’hôte Docker (VM ou conteneur sous Proxmox, pas directement l’hyperviseur). Préparer `/srv/tu-etais-la/media`, accessible en écriture à l’UID/GID 10001 du service média. Prévoir lecture pour l’utilisateur réel de n8n.
2. Utiliser `compose.media-service.yml` comme fragment à fusionner. Il ne remplace pas le Compose n8n. Fournir `MEDIA_TOKEN` (clé aléatoire dédiée, au moins 32 caractères) et `MEDIA_ORIGINS` (origine exacte GitHub Pages ou domaine personnalisé, sans chemin, plusieurs origines séparées par virgules). Ne pas committer le fichier de secrets.
3. Relier le reverse proxy HTTPS au port 8787 de l’hôte. Si le proxy tourne dans Docker, utiliser le réseau interne partagé et `media:8080` plutôt que son propre localhost. Choisir une adresse dédiée, par exemple `https://medias.example.org`, sans détourner l’éditeur n8n.
4. Autoriser GET, PUT, OPTIONS ; préserver Authorization et les en-têtes CORS. Limiter les requêtes au proxy et limiter les corps à 30 Mio (ou légèrement plus côté proxy). Délai d’envoi de 120 secondes. Aucun listing public du dossier.
5. Monter le même dossier dans n8n, en lecture seule, sous `/files/tu-etais-la`. Préserver tous les montages existants et adapter les restrictions de lecture de votre version n8n.
6. Dans le Studio, saisir l’adresse HTTPS du service média et la clé dédiée. Vérifier la connexion puis envoyer les copies. La clé reste en mémoire, l’adresse seule est mémorisée. Fermer ou actualiser la page efface la clé.

La clé saisie est un secret d’administration : utiliser uniquement un appareil de confiance. Le site public ne contient aucun secret embarqué. CORS restreint les navigateurs autorisés mais ne remplace pas le contrôle de la clé.

## Contrat HTTP

Toutes les requêtes applicatives utilisent `Authorization: Bearer …`.

- `GET /media` : catalogue serveur, identifiant, version, SHA-256, extension, taille.
- `PUT /media/{id}/{clean|phone}` : corps binaire, `X-Media-Extension: mp3|wav|m4a|ogg`. Identifiants validés dans le catalogue des scripts, taille maximale 30 Mio, contrôle de signature de fichier (pas une analyse complète du codec).
- `GET /media/{id}/{clean|phone}` : écouter la copie serveur authentifiée depuis le Studio.

Le navigateur compare l’empreinte du fichier avant de l’envoyer pour éviter les copies identiques. Les erreurs ne suppriment jamais les copies locales. Une confirmation n’arrive qu’après écriture du fichier et validation du catalogue SQLite. Les anciennes révisions restent sur disque. Aucun fichier n’est envoyé à Telegram par cette opération.

## Raccordement n8n

Le catalogue SQLite est dédié aux médias et ne modifie pas les tables n8n. Un workflow peut appeler `GET /media` avec un credential Header Auth n8n, retrouver identifiant/version, puis construire le chemin contrôlé :

`/files/tu-etais-la/audio/{id}/{version}/{sha256}.{extension}`

Lire le fichier avec Read/Write Files from Disk, puis envoyer le binaire au destinataire Telegram de la partie. Ce workflow et le cache Telegram file_id restent à raccorder à votre bot. Ne pas accepter des chemins ou destinataires libres envoyés par le navigateur d’un joueur.

Sauvegarder le dossier audio et le catalogue SQLite ensemble ; pour un export SQLite pendant l’exécution, utiliser son API backup, pas une copie brute pendant les écritures. Prévoir une copie hors serveur. Le service ne réalise pas encore cette sauvegarde GitHub.
