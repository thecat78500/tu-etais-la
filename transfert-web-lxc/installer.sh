#!/bin/sh
set -eu
test "$(id -u)" = 0 || { echo 'Lancer dans le LXC n8n comme root.' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'Le paquet python3 est requis.' >&2; exit 1; }
cd "$(dirname "$0")"
test -f media_server.py && test -f catalogue.json || { echo 'Transférer tous les fichiers du paquet.' >&2; exit 1; }
id tuetaislamedias >/dev/null 2>&1 || useradd --system --home-dir /opt/tu-etais-la-medias --shell /usr/sbin/nologin tuetaislamedias
install -d -m 755 /opt/tu-etais-la-medias
install -d -o tuetaislamedias -g tuetaislamedias -m 750 /srv/tu-etais-la/media/imports
install -m 644 media_server.py catalogue.json /opt/tu-etais-la-medias/
if [ ! -e /etc/tu-etais-la-medias.env ]; then
  (umask 077; python3 - <<'PY'
from pathlib import Path
import secrets
Path('/etc/tu-etais-la-medias.env').write_text(
    'MEDIA_TOKEN='+secrets.token_urlsafe(40)+'\n'
    'MEDIA_ROOT=/srv/tu-etais-la/media/imports\n'
    'MEDIA_CATALOGUE=/opt/tu-etais-la-medias/catalogue.json\n'
    'MEDIA_ORIGINS=https://thecat78500.github.io,http://127.0.0.1:8765,http://localhost:8765\n'
    'MEDIA_BIND=0.0.0.0\nPORT=8787\n', encoding='utf-8')
PY
  )
fi
chmod 600 /etc/tu-etais-la-medias.env
install -m 644 tu-etais-la-medias.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable tu-etais-la-medias
systemctl restart tu-etais-la-medias
echo 'Service préparé sur le port interne 8787. Restreindre ce port au serveur Nginx sur le réseau local.'
echo 'Ne pas ajouter de redirection NAT vers 8787. Le port SCP 2222 reste inchangé.'
echo 'Vérifier : systemctl status tu-etais-la-medias --no-pager'
