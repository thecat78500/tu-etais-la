# Tu Étais Là — mémoire et agent Sally dans votre LXC

Ce dossier fournit le service Python de mémoire et deux workflows n8n importables. Cible : n8n installé directement dans un LXC Debian/Ubuntu, lancé par systemd. Aucun Docker, aucune base cloud et aucune nouvelle redirection NAT ne sont nécessaires. Le service est accessible seulement à n8n sur `127.0.0.1:8790`.

## Ce qui fonctionne dans cette version

- Création d’une partie pour 4 à 10 personnes, code d’inscription, photo Telegram facultative (identifiant du fichier conservé), affectation privée et aléatoire des rôles/camps, pause/reprise/fin.
- Distribution : 4→2/1/1, 5→3/1/1, 6→3/2/1, 7→4/2/1, 8→4/2/2, 9→5/2/2, 10→5/3/2. Gentils/méchants/ambigus, ambigus jamais plus nombreux que méchants.
- Historique persistant par partie ET conversation. Les 12 derniers échanges de ce joueur sont transmis à l’IA. Les anciennes conversations restent sur disque mais ne sont pas mélangées avec une nouvelle partie.
- Réponses libres de Sally avec votre credential OpenAI existant, format JSON contrôlé, contexte limité à l’introduction et aux étapes déjà accessibles. Aucun outil donné à l’IA : elle ne choisit ni les destinataires, ni les rôles, ni les étapes.
- Limites : une génération en cours par joueur, 4 appels/minute et 80 appels par joueur et partie. Modèle initial `gpt-4.1-mini`, modifiable dans `/etc/tu-etais-la.env`. Les appels utilisent votre facturation API habituelle ; aucun appel réel n’a été effectué pendant le développement.
- Boîte d’envoi persistante et journal de confirmation. Identifiants Telegram des messages et des vocaux conservés. En cas de doute sur la livraison, mise en attente d’une résolution manuelle pour éviter une relance aveugle.
- Six chuchotements textuels préparés, envoyés à chaque joueur avec intervalles aléatoires de 2–4 minutes, puis arrêt. Les réponses aux questions restent disponibles. Ces six interventions ne sont pas générées par l’IA.
- `/vocal` envoie votre introduction Sally existante en message vocal Telegram. Le MP3 déjà transféré est réutilisé.
- Sauvegarde SQLite quotidienne cohérente, et outil de contrôle des envois.

## Limites à connaître avant une vraie partie

Il s’agit de l’intégration complète mémoire/conversation/envoi, pas du moteur final des cinq énigmes renouvelables. Les scénarios fournis sont vos dix introductions et indications d’étapes : pas des jeux d’énigmes validés ni leurs solutions. L’organisateur fait avancer les étapes avec `/etape`. Les pouvoirs, objectifs ambigus, votes et conditions de victoire restent à raccorder. Les rôles/camps servent ici à tester les échanges privés.

L’IA est invitée à ne pas inventer de preuves et ne reçoit pas la vérité finale ni les secrets des autres joueurs. Le serveur valide la forme et les identifiants de faits cités, pas la véracité sémantique de chaque phrase. Une campagne de tests de conversation reste nécessaire avant une partie publique.

Pas de nouveau vocal synthétisé, transcription des vocaux entrants, reconnaissance des images, simulation d’appel ou orchestration musicale dans cette version. Les photos restent référencées dans Telegram ; elles ne sont pas archivées physiquement sur le serveur. Le cache `file_id` des vocaux est enregistré à titre d’historique, mais sa réutilisation automatique n’est pas encore branchée. L’iPad/GitHub Pages n’est pas connecté à ces sessions : on teste d’abord par commandes Telegram. Le Studio et les imports SCP sont inchangés.

## Où sont les informations ?

| Emplacement dans le LXC | Contenu |
|---|---|
| `/opt/tu-etais-la/` | Code du service et dix scénarios |
| `/srv/tu-etais-la/etat/jeu.sqlite3` | Parties, joueurs, rôles/camps, photos référencées, événements, conversations, boîte d’envoi et journal |
| `/srv/tu-etais-la/media/audio/` | Vos MP3 transférés par SCP, dont `sally-introduction.mp3` |
| `/srv/tu-etais-la/media/images/` | Images que vous déposez manuellement ; envoi non branché ici |
| `/srv/tu-etais-la/sauvegardes/` | Copies quotidiennes de la base SQLite |
| `/etc/tu-etais-la.env` | Clé interne du service, administrateurs, modèle et chemins |
| Credentials n8n existants | Clés OpenAI et Telegram |

Les données sont indépendantes de l’historique d’exécution n8n. `saveDataSuccessExecution` et `saveDataErrorExecution` sont désactivés dans les exports pour limiter les copies de conversations dans les journaux d’exécution. Une exécution manuelle peut néanmoins exposer son contenu à l’administrateur de n8n. Les prompts contiennent la conversation et le rôle/camp du destinataire, envoyés à OpenAI avec `store:false` ; cela ne constitue pas une garantie d’absence de toute rétention du fournisseur. Aucun nom de compte ou identifiant Telegram n’est nécessaire dans le prompt.

**Ne publiez pas ce dossier, la base, les sauvegardes ou les secrets dans le dépôt public GitHub.** Une sauvegarde sur le même LXC protège d’une erreur logique, pas de la perte du disque/hôte. Téléchargez régulièrement base sauvegardée et médias sur votre ordinateur avec WinSCP. La sauvegarde GitHub privée automatique reste à mettre en place.

## 1. Transférer les fichiers

Dans la console du LXC, comme root :

```bash
mkdir -p /root/tu-etais-la-installation
```

Dans WinSCP, transférez **le contenu du dossier serveur-jeu** dans `/root/tu-etais-la-installation/`. Gardez les JSON sur votre ordinateur pour les importer ensuite dans n8n. Les MP3 n’ont pas besoin d’être retransférés.

## 2. Installer le service de mémoire

```bash
cd /root/tu-etais-la-installation
python3 --version
bash installer.sh
systemctl status tu-etais-la --no-pager
```

Le script crée un utilisateur système `tuetaisla` sans connexion interactive, les dossiers d’état et de sauvegardes privés, et une clé interne aléatoire. Il préserve le fichier `.env` existant s’il y en a un. Il ne redémarre pas et ne modifie pas n8n. Le service mémoire est redémarré lors d’une mise à jour. La base existante est conservée. Si Python manque, installez le paquet `python3` via le gestionnaire de votre distribution avant de relancer.

L’organisateur configuré par défaut est votre identifiant Telegram : `6644853325`. Il est aussi joueur et occupe une place. Pour changer/ajouter des organisateurs, modifier `GAME_ADMIN_IDS` dans `/etc/tu-etais-la.env` (séparer par virgules), puis `systemctl restart tu-etais-la`.

## 3. Ajouter le credential interne dans n8n

Affichez la clé **uniquement dans votre console privée** :

```bash
sed -n 's/^GAME_API_TOKEN=//p' /etc/tu-etais-la.env
```

Ne la transmettez pas dans le chat et ne la mettez pas dans GitHub. Dans n8n → Credentials → nouveau credential **Header Auth** :

- Nom du credential : `Mémoire du jeu`
- Header Name : `Authorization`
- Header Value : `Bearer LA_CLE_AFFICHEE` (un espace après Bearer)

Cette clé est indépendante de Telegram et OpenAI. Les appels passent par localhost dans le même LXC ; ne publiez pas ce port via Nginx/NAT.

## 4. Importer les deux workflows

Dans n8n : créer un workflow → menu ⋯ → Import from File.

### `01-reception-ia.json`

- **Recevoir Telegram** : choisir le credential existant du bot `tu_etais_la_maison_bot`.
- **Memoriser et preparer** et **Valider la reponse et mettre en attente** : choisir le credential Header Auth `Mémoire du jeu`.
- **Agent Sally - OpenAI** : choisir votre credential OpenAI existant, dans Predefined Credential Type / OpenAI. Ce nœud HTTP appelle `/v1/responses` en réutilisant ce credential. Il ne crée pas une nouvelle clé. En cas de modèle indisponible ou d’API refusée, le service met un texte de repli en attente ; vérifier la réponse du nœud en test manuel.

### `02-expedition.json`

- **Reserver les envois**, **Confirmer le texte**, **Confirmer le vocal** : choisir `Mémoire du jeu`.
- **Envoyer le texte** : choisir votre credential Telegram existant.
- **Envoyer le vocal** : remplacer `REMPLACER_PAR_VOTRE_JETON` dans l’URL par le jeton BotFather déjà utilisé pour votre test `sendVoice`. L’URL reste dans n8n, pas dans GitHub. Un export configuré ou une capture de ce nœud contient un secret ; le masquer avant partage. La réception et les textes réutilisent les credentials stockés ; l’envoi vocal utilise cette URL parce que le nœud Telegram standard de la version visée ne propose pas `sendVoice`.

Arrêtez/désactivez l’ancien workflow de test Telegram avant d’activer le nouveau : un bot ne peut pas recevoir ses mises à jour dans deux webhooks différents. Enregistrez puis activez/publiez **les deux nouveaux workflows**. Le workflow d’expédition est déclenché toutes les 10 secondes ; s’il n’est pas actif, les messages s’accumulent sans partir.

## 5. Première session de test

Depuis votre compte Telegram organisateur :

```text
/creer 4 1
```

Cela crée 4 places (vous compris), affaire 1, et renvoie un code. Trois autres comptes Telegram ouvrent votre bot, appuient sur Démarrer et envoient :

```text
/rejoindre CODE Alice
```

Un lien `https://t.me/tu_etais_la_maison_bot?start=CODE` fonctionne aussi ; le pseudo est alors « Invité ». Il faut ouvrir le bot et appuyer sur Démarrer pour recevoir ses messages privés. Chaque compte n’a qu’une partie non terminée à la fois.

Quand les quatre sont inscrits :

```text
/demarrer
```

Chacun reçoit son rôle/camp et l’introduction. Puis écrivez librement, par exemple : « Sally, qu’est-ce que tu entends ? ». Attendez jusqu’à quelques dizaines de secondes pour la génération puis l’expédition. Pour tester le son : `/vocal`. Une photo envoyée au bot pendant la partie devient sa photo de profil pour cette session (référence Telegram seulement).

Autres commandes organisateur : `/pause`, `/reprendre`, `/etape 2`, `/etape 3`, `/etape 4`, `/etape 5`, `/fin`. Les étapes avancent une par une. `/fin` arrête les envois encore en attente et conserve l’historique. Un message déjà en cours d’envoi peut encore arriver. `/statut` fonctionne pour tous ; `/quitter` est disponible pendant l’accueil. Le créateur quitte l’accueil en le fermant pour tout le monde.

Il faut quatre comptes distincts pour tester le lancement ; le minimum de quatre n’est pas contourné dans cette version.

## 6. Surveiller et traiter un envoi incertain

```bash
runuser -u tuetaisla -- python3 /opt/tu-etais-la/admin.py status
```

États : `pending` (à envoyer), `sending` (réservé), `sent` (confirmé par Telegram), `failed` (rejet explicite), `uncertain` (résultat inconnu), `cancelled` (annulé). `sent` ne signifie pas « lu » et aucun bouton d’accusé de lecture n’est fourni ici.

Pour consulter l’historique et les envois d’une partie depuis la console privée du serveur (remplacer CODE), sans publier les conversations :

```bash
runuser -u tuetaisla -- python3 /opt/tu-etais-la/admin.py history CODE
```

Un envoi réservé depuis plus de trois minutes sans confirmation devient `uncertain`. Les envois suivants de ce destinataire sont bloqués pour éviter une cascade de doublons ou un ordre incohérent. Vérifiez sa conversation Telegram avant de décider :

```bash
# Si le message est arrivé, ou si vous renoncez à l'envoyer :
runuser -u tuetaisla -- python3 /opt/tu-etais-la/admin.py cancel 123

# S'il n'est pas arrivé : nouvelle tentative explicite, avec risque de doublon.
runuser -u tuetaisla -- python3 /opt/tu-etais-la/admin.py retry 123 --confirm
```

Remplacer `123` par l’identifiant de la boîte d’envoi. L’annulation manuelle n’ajoute pas le message à l’historique livré. Telegram ne fournit pas de clé d’idempotence pour éliminer mathématiquement le risque de doublon après une perte de confirmation. Une erreur réseau ou une réponse 5xx n’est donc pas relancée automatiquement. Une réponse Telegram explicite 429 est remise en attente selon `retry_after`.

Pour les textes envoyés par le nœud Telegram natif, certaines erreurs sont encapsulées par n8n : elles deviennent `uncertain` plutôt qu’une reprise automatique 429. Le journal marque les messages rejetés sans exposer les clés. Le code ne retente pas automatiquement les appels OpenAI ; une génération abandonnée depuis trois minutes devient une réponse de repli lors du prochain passage du workflow d’expédition.

## 7. Sauvegarder

```bash
systemctl list-timers tu-etais-la-backup.timer
systemctl start tu-etais-la-backup.service
ls -lh /srv/tu-etais-la/sauvegardes/
```

Téléchargez les sauvegardes `.sqlite3` avec WinSCP et les médias séparément. Les sauvegardes ne sont pas supprimées automatiquement : surveiller l’espace disque et appliquer votre politique de conservation. L’API backup SQLite garantit une copie cohérente pendant l’exécution, contrairement à une simple copie brute d’une base en cours d’écriture.

Pour restaurer, arrêter `tu-etais-la`, conserver la base actuelle à part, remettre la sauvegarde sous le nom `jeu.sqlite3` dans le dossier `etat`, rendre le fichier à `tuetaisla:tuetaisla` avec permissions `600`, puis redémarrer le service. La restauration ramène aussi l’historique des confirmations à sa date : ne relancez pas aveuglément d’anciens envois.

## Vérifications fournies

`python3 test_engine.py` teste comptes/camps 4–10, contrôles organisateur, dédoublonnage, cloisonnement du contexte, sauvegarde, concurrence, reprise, réponses IA invalides, pauses et contrôles HTTP avec un serveur local. Aucun appel OpenAI/Telegram et aucun crédit consommé par ces tests. Les deux workflows ont une validation structurelle locale ; leur exécution dans votre version n8n et avec vos credentials reste à vérifier après import.

Références :
- [OpenAI — sorties structurées](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [n8n — fichiers disque](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.readwritefile/)
- [Telegram — messages vocaux](https://core.telegram.org/bots/api#sendvoice)
