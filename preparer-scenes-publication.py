"""Prépare seulement les fichiers publics de la mise à jour des scènes."""
from pathlib import Path
import shutil
import zipfile
import hashlib
import json

source = Path(__file__).resolve().parent
destination = source.parent / 'mise-a-jour-scenes-github'
destination.mkdir(exist_ok=True)
fichiers = ['ecran.html', 'plateau.js', 'plateau.css'] + [str(p.relative_to(source)).replace('\\', '/') for p in sorted((source / 'assets/scenes/affaire-01').glob('*.png'))]
assert len(fichiers) == 12
for nom in fichiers:
    cible = destination / nom
    cible.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / nom, cible)
archive = source.parent / 'mise-a-jour-scenes-github.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for nom in fichiers:
        z.write(destination / nom, nom)
manifest = [{'fichier': nom, 'octets': (destination / nom).stat().st_size, 'sha256': hashlib.sha256((destination / nom).read_bytes()).hexdigest()} for nom in fichiers]
(source / 'captures/scenes/manifest-publication.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'{len(fichiers)} fichiers publics prêts dans {destination}. Archive : {archive}. Aucun envoi GitHub effectué.')
