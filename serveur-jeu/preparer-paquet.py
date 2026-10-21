from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root=Path(__file__).resolve().parent
names=['engine.py','server.py','admin.py','installer.sh','scenarios.json',
       'tu-etais-la.service','tu-etais-la-backup.service','tu-etais-la-backup.timer',
       '01-reception-ia.json','02-expedition.json','INSTALLATION.md','test_engine.py','verifier-workflows.cjs']
target=root.parent/'installation-n8n-sally.zip'
with ZipFile(target,'w',ZIP_DEFLATED) as archive:
    for name in names:
        archive.write(root/name,'serveur-jeu/'+name)
print(f'Archive prête : {len(names)} fichiers, {target.stat().st_size} octets. Aucun secret ni base utilisateur.')
