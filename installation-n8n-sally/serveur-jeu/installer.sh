#!/bin/sh
# À lancer dans le LXC Debian/Ubuntu comme root, depuis ce dossier.
set -eu
if [ "$(id -u)" != 0 ]; then echo 'Lancer comme root dans le LXC n8n.' >&2; exit 1; fi
command -v python3 >/dev/null || { echo 'Installer python3 avant de continuer.' >&2; exit 1; }
cd "$(dirname "$0")"
test -f scenarios.json || { echo 'scenarios.json manquant : transférer tout le dossier serveur-jeu.' >&2; exit 1; }
id tuetaisla >/dev/null 2>&1 || useradd --system --home-dir /opt/tu-etais-la --shell /usr/sbin/nologin tuetaisla
install -d -m 755 /opt/tu-etais-la
install -d -o tuetaisla -g tuetaisla -m 700 /srv/tu-etais-la/etat /srv/tu-etais-la/sauvegardes
install -m 644 engine.py server.py admin.py scenarios.json /opt/tu-etais-la/
if [ ! -e /etc/tu-etais-la.env ]; then
  (umask 077; python3 - <<'PY'
import secrets
from pathlib import Path
Path('/etc/tu-etais-la.env').write_text('GAME_API_TOKEN='+secrets.token_urlsafe(40)+'\nGAME_ADMIN_IDS=6644853325\nGAME_DB=/srv/tu-etais-la/etat/jeu.sqlite3\nGAME_MEDIA_ROOT=/srv/tu-etais-la/media\nGAME_AI_MODEL=gpt-4.1-mini\n', encoding='utf-8')
PY
  )
fi
chmod 600 /etc/tu-etais-la.env
install -m 644 tu-etais-la.service tu-etais-la-backup.service tu-etais-la-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable tu-etais-la.service tu-etais-la-backup.timer
systemctl restart tu-etais-la.service
systemctl start tu-etais-la-backup.timer
echo 'Service installé. Aucun changement du service n8n, aucune clé OpenAI ou Telegram copiée.'
echo 'Vérifier : systemctl status tu-etais-la --no-pager'
