# Envoyer les vocaux du Studio vers le serveur n8n

Cible confirmée : n8n direct dans un LXC, Nginx sur une autre machine, IP publique 84.74.12.173, SSH/SCP redirigé sur 2222. Le transfert depuis une page utilise HTTPS sur le point d’entrée Nginx existant ; SSH/SCP 2222 reste disponible pour WinSCP. Pas de nouvelle redirection NAT pour ce service.

Mise à jour : cette version accepte les sons MP3/M4A/WAV/OGG et les images JPG/PNG/WebP (30 Mio maximum). La page publique dédiée est `transfert.html`, accompagnée de `transfert.js` et `transfert.css` : ajouter ces trois fichiers à la racine du dépôt GitHub pour accéder à `https://thecat78500.github.io/tu-etais-la/transfert.html`. Aucun script narratif privé ni clé n’y est inclus. La galerie d’images de la démonstration n’est pas automatiquement alimentée par ces imports ; les fichiers sont conservés pour n8n.

L’utilisateur a déjà installé et démarré la première version audio dans le LXC `192.168.0.251`. Pour ajouter les images et les fichiers libres, retransférer le contenu de ce paquet actualisé puis relancer `bash installer.sh` depuis son dossier de transfert : la clé existante, les fichiers et le catalogue sont préservés, et la colonne des noms de fichiers est ajoutée automatiquement. Aucun changement du service n8n, de sa base ou de ses credentials.

## 1 — Installer dans le LXC n8n

Décompresser l’archive sur l’ordinateur. Dans la console du LXC :

```bash
mkdir -p /root/transfert-web-installation
```

Avec WinSCP, transférer le contenu du dossier `transfert-web-lxc` vers `/root/transfert-web-installation/`, puis :

```bash
cd /root/transfert-web-installation
bash installer.sh
systemctl status tu-etais-la-medias --no-pager
hostname -I
```

Garder l’IP locale du LXC affichée par la dernière commande. Le service utilise Python standard, sans module à télécharger. Il crée un utilisateur dédié et ne réécrit pas les médias déjà envoyés par SCP. Le port interne `8787` doit être accessible depuis Nginx seulement : appliquer la règle correspondante à votre pare-feu LXC/Proxmox. Ne pas exposer ce port sur Internet. Le jeton reste requis pour toutes les opérations de fichiers.

## 2 — Raccorder Nginx

Il faut connaître l’adresse HTTPS EXACTE qui ouvre n8n dans le navigateur, avec son éventuel port. L’IP publique seule n’indique pas si le certificat HTTPS est valide pour cette adresse. Copier cette URL depuis la barre d’adresse ; ne pas utiliser `:2222` dans le Studio.

Pour Nginx configuré par fichiers : placer `nginx-location.conf` dans le bloc `server` HTTPS existant de n8n et remplacer `IP_LOCALE_LXC_N8N` par l’IP privée du LXC. La barre finale de `proxy_pass` retire le préfixe `/jeu-medias/`. Préserver la configuration des autres chemins n8n, vérifier avec `nginx -t`, puis recharger Nginx seulement si le test réussit. Conserver une copie de la configuration précédente avant modification.

Si vous utilisez Nginx Proxy Manager : ne pas coller ce bloc dans un emplacement au hasard. Il faut créer une Custom Location `/jeu-medias/` et adapter la suppression de ce préfixe ainsi que la limite des corps dans son contexte. Fournir une capture de l’interface sans secrets pour préparer les champs exacts. Le fragment livré vise Nginx configuré par fichiers.

Adresse à saisir ensuite dans le Studio :

```text
https://ADRESSE-HTTPS-EXISTANTE/jeu-medias
```

Le domaine doit réellement pointer vers ce Nginx, son certificat doit être accepté par le navigateur, et les méthodes GET/PUT/OPTIONS doivent passer. Les réponses CORS sont générées par le service ; ne pas ajouter d’en-têtes CORS en doublon dans Nginx. L’origine GitHub autorisée est `https://thecat78500.github.io` (sans le chemin du dépôt). Le Studio local sur 8765 est également autorisé. Aucune clé n’est incluse dans le site.

## 3 — Clé d’import et premier envoi

Lire la clé dans votre console privée, sans la transmettre au chat :

```bash
sed -n 's/^MEDIA_TOKEN=//p' /etc/tu-etais-la-medias.env
```

Pour l’envoi direct depuis GitHub, ouvrir la nouvelle page `https://thecat78500.github.io/tu-etais-la/transfert.html` après avoir ajouté ses trois fichiers au dépôt. Saisir l’adresse HTTPS et la clé, vérifier la connexion, sélectionner les fichiers puis cliquer sur « Envoyer au serveur ». Cette page n’utilise pas les imports locaux IndexedDB : elle reçoit les fichiers choisis directement depuis l’appareil. Elle affiche les copies présentes sur le serveur et permet de copier leur chemin n8n. Les noms d’origine sont conservés comme métadonnées ; le fichier physique est identifié par son empreinte SHA-256 pour éviter les chemins arbitraires.

L’ancien Studio local `http://127.0.0.1:8765/studio-voix.html` reste également compatible avec l’API audio. Ce Studio n’est pas publié sur GitHub Pages car il contient les textes privés. Pour ses copies IndexedDB existantes :

1. Importer le fichier sous le script correspondant, comme avant (ou conserver les imports existants).
2. Dans « Relier les archives au serveur », saisir l’adresse HTTPS `/jeu-medias` et la clé d’import.
3. Cliquer sur « Vérifier la connexion » puis « Envoyer les copies de cet appareil ».
4. Attendre la confirmation. Le bouton Écouter vérifie la copie sur le serveur.

La clé reste en mémoire pendant la visite et disparaît au rechargement. L’adresse seule est mémorisée. Les copies locales ne sont pas supprimées. La sauvegarde GitHub n’est pas raccordée ; garder les fichiers sources sur l’ordinateur.

## Emplacement des fichiers et lecture dans n8n

Les imports web sont stockés dans :

```text
/srv/tu-etais-la/media/imports/audio/IDENTIFIANT/clean/EMPREINTE.mp3
/srv/tu-etais-la/media/imports/audio/IDENTIFIANT/phone/EMPREINTE.mp3
/srv/tu-etais-la/media/imports/images/file-EMPREINTE/clean/EMPREINTE.png
```

Le catalogue `/srv/tu-etais-la/media/imports/catalogue.sqlite` associe identifiant, version et révision. Le champ `path` de `GET /jeu-medias/media` donne le chemin relatif exact, à préfixer par `/srv/tu-etais-la/media/imports/` dans un nœud Read/Write Files from Disk. n8n fonctionnant avec root peut lire ces fichiers. Si n8n refuse un chemin, vérifier ses restrictions de fichiers avant d’envisager des permissions plus larges.

La page dédiée génère les identifiants `file-EMPREINTE` pour les imports libres ; le Studio historique garde ses identifiants de scripts. Leur association aux étapes d’un scénario reste à configurer. Les contrôles de signature de fichier ne remplacent pas un décodage complet ou un antivirus.

Le fichier SCP existant `/srv/tu-etais-la/media/audio/sally-introduction.mp3` n’est ni écrasé ni automatiquement remplacé par un import web. Le workflow de test qui le lit garde donc sa copie actuelle. Le raccordement de la sélection des médias du jeu à ce catalogue est l’étape suivante après le premier import confirmé.

Les anciennes révisions sont conservées ; aucune purge automatique. Sauvegarder les fichiers ET le catalogue avec une sauvegarde SQLite cohérente. Une copie du navigateur n’est pas un backup durable indépendant.

## Diagnostic simple

- Échec de connexion : vérifier l’URL HTTPS, le certificat, le proxy et les origines.
- 401 : clé d’import incorrecte.
- 403 : origine non autorisée ou protection Nginx supplémentaire.
- 413 : fichier trop gros ou limite Nginx trop basse.
- 415 : signature audio non reconnue (le contrôle ne remplace pas une analyse complète du codec).
- 502 : Nginx ne joint pas le service sur l’IP locale du LXC et le port 8787.

Aucune requête d’import n’envoie de message Telegram ni ne consomme de crédit IA.
