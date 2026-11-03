#!/bin/bash
set -euo pipefail
# À lancer dans le conteneur n8n. Aucun arrêt ni changement du service n8n.
test "$(id -u)" = 0 || { echo 'Exécuter dans la console administrateur du conteneur n8n.'; exit 1; }
test -f /etc/tu-etais-la-direct.env || { echo 'Configuration privée absente : installation arrêtée.'; exit 1; }
BASE=/opt/tu-etais-la-direct
NODE_SOURCE=${NODE_SOURCE:-/root/.nvm/versions/node/v20.19.6/bin/node}
test -x "$NODE_SOURCE" || { echo 'Runtime Node existant introuvable.'; exit 1; }
test -f /tmp/tu-etais-la-relais.cjs || { echo 'Code du relais absent.'; exit 1; }
if ! id tu-etais-la-direct >/dev/null 2>&1; then useradd --system --no-create-home --shell /usr/sbin/nologin tu-etais-la-direct; fi
install -d -m 0755 "$BASE"
install -m 0755 "$NODE_SOURCE" "$BASE/node"
install -m 0644 /tmp/tu-etais-la-relais.cjs "$BASE/relais.cjs"
install -d -m 0700 -o tu-etais-la-direct -g tu-etais-la-direct /var/lib/tu-etais-la-direct
cat >/etc/systemd/system/tu-etais-la-direct.service <<'UNIT'
[Unit]
Description=Tu Etais La - notifications et murmures pendant les parties
After=network.target n8n.service
[Service]
Type=simple
User=tu-etais-la-direct
Group=tu-etais-la-direct
EnvironmentFile=/etc/tu-etais-la-direct.env
ExecStart=/opt/tu-etais-la-direct/node /opt/tu-etais-la-direct/relais.cjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/tu-etais-la-direct
UMask=0077
[Install]
WantedBy=multi-user.target
UNIT
chmod 0600 /etc/tu-etais-la-direct.env
systemctl daemon-reload
systemctl enable --now tu-etais-la-direct
systemctl is-active tu-etais-la-direct
