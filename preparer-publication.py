"""Prépare uniquement la démonstration publique, sans publier sur GitHub."""
from pathlib import Path
import re
import shutil
import zipfile

source = Path(__file__).resolve().parent
destination = source.parent / 'publication-github'
destination.mkdir(exist_ok=True)
files = ['index.html', 'style.css', 'lobby.css', 'dread.css', 'tablet.css',
         'app.js', 'lobby.js', 'media-store.js', 'admin-gallery.js',
         'admin.html', 'admin.css', 'admin.js', 'transfert.html', 'transfert.css', 'transfert.js',
         'ecran.html', 'ecran.css', 'ecran.js', 'catalogue-affaires.json']
assets = set()
for name in files:
    text = (source / name).read_text(encoding='utf-8')
    assets.update(re.findall(r'assets/[A-Za-z0-9_./-]+\.(?:png|mp3)', text))
for name in files + sorted(assets):
    target = destination / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source / name, target)
(destination / '.nojekyll').write_text('', encoding='utf-8')
(destination / 'README.md').write_text('''# Tu Étais Là

Démonstration d’un jeu d’enquête fantastique pour 4 à 10 joueurs, conçue pour iPad.

L’accueil index.html reste une démonstration autonome avec des codes visibles. L’écran ecran.html permet de choisir l’effectif et le scénario, créer, lancer et arrêter les parties grâce au workflow organisateur n8n protégé par un credential Header Auth. Le code organisateur est saisi à l’utilisation ; aucun secret n’est inclus dans les fichiers publics. Le mode second écran en lecture seule via /ipad reste disponible. Les workflows doivent être installés et activés sur n8n avant utilisation. Dix affaires sont présentées avec leurs images et introductions ; leurs cinq familles d’énigmes sont générées et validées côté n8n. Les rôles, camps et indices privés restent sur Telegram.

L’administration des images conserve ses imports dans le navigateur de cet appareil. Le Studio des voix, ses scripts privés, le service serveur et les documents de conception ne sont pas inclus dans cette publication.

Publication : Settings → Pages → Deploy from a branch → main → / (root).
''', encoding='utf-8')
for name in assets:
    assert (destination / name).is_file(), name
print(f'Publication préparée : {len(files)} fichiers web et {len(assets)} médias. Aucun envoi GitHub effectué.')
with zipfile.ZipFile(source.parent/'site-tu-etais-la.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in files+sorted(assets)+['.nojekyll','README.md']:
        archive.write(destination/name,name)
print('Archive site-tu-etais-la.zip préparée avec les seuls fichiers publics autorisés.')
