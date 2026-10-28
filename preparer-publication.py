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
         'ecran.html', 'ecran.css', 'ecran.js', 'plateau.js', 'plateau.css', 'catalogue-affaires.json', 'invitation-qr.js',
         'vendor/qrcode.js', 'vendor/qrcode-LICENSE.txt', 'vendor/qrcode-SOURCE.txt']
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

L’adresse principale ouvre directement le jeu ecran.html : choisir, accueillir par QR code, jouer, puis rejouer. Une fois les workflows configurés et activés, toutes les commandes de partie passent par le site. L’option explicite de mémorisation conserve l’accès sur l’appareil organisateur pour reprendre la table au retour ; la déconnexion l’efface. Aucun secret n’est inclus dans les fichiers publics. La configuration et le mode second écran sont regroupés dans les réglages. Dix affaires sont présentées avec leurs images et introductions ; leurs cinq familles d’énigmes sont générées et validées côté n8n. Les rôles, camps et indices privés restent sur Telegram.

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
