from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil
root=Path(__file__).resolve().parent
shutil.copy2(root.parent/'deploiement-vps/media_server.py',root/'media_server.py')
shutil.copy2(root.parent/'audio-scripts/bibliotheque-v2/catalogue.json',root/'catalogue.json')
names=['media_server.py','catalogue.json','installer.sh','tu-etais-la-medias.service','nginx-location.conf','LIRE-EN-PREMIER.md']
target=root.parent/'transfert-web-lxc.zip'
with ZipFile(target,'w',ZIP_DEFLATED) as archive:
    for name in names: archive.write(root/name,'transfert-web-lxc/'+name)
page_zip=root.parent/'page-transfert-github.zip'
with ZipFile(page_zip,'w',ZIP_DEFLATED) as archive:
    for name in ['transfert.html','transfert.css','transfert.js']: archive.write(root.parent/name,name)
print(f'Paquet transfert web préparé : {len(names)} fichiers, {target.stat().st_size} octets. Non déployé.')
