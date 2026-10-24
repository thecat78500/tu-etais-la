# Vos sons d'ambiance pour le plateau

Déposez ici vos propres bruits : le plateau les joue **au hasard** pendant la partie, de plus en plus souvent à mesure que le jeu avance. Rien à changer dans le code.

## Deux sons d'événements

Ces deux sons jouent à des moments précis de la partie, **pas au hasard** :

| Nom du fichier | Quand il joue |
|---|---|
| `sceau-ouvert.wav` | à chaque sceau qui s'ouvre (réponse trouvée), d'abord, avant que le téléphone de Sally sonne |
| `indice-decouvert.wav` | juste après : de nouveaux indices arrivent sur les téléphones |

Sans fichier, l'iPad joue à leur place un verrou qui claque suivi d'une résonance grave, puis deux notes claires qui montent.

## Remplacer un bruit de base

Les huit bruits de base ont ces noms. Un fichier du même nom prend leur place, **le reste continue de fonctionner** :

`craquement` · `coups` · `pas` · `vent` · `murmure` · `horloge` · `porte` · `cloche`

**Formats acceptés : wav, mp3, m4a, ogg.** Pour un nom sans extension, le plateau cherche d'abord `nom.wav`, puis `.mp3`, `.m4a`, `.ogg`. Donc `craquement.wav`, `sceau-ouvert.wav` et `indice-decouvert.wav` suffisent.

Les bruits dont vous ne déposez pas de fichier restent ceux fabriqués par l'iPad.

## Ajouter vos propres noms : la liste `effets.json`

Pour utiliser **vos** sons (n'importe quel nom), créez un fichier `effets.json` dans ce dossier. Deux formes possibles :

**Les mêmes sons à tous les moments :**

```json
["porte-qui-claque", "rire-lointain", "pas-dans-lescalier"]
```

**Des sons différents selon l'avancement** (début = sceaux I et II, milieu = III et IV, fin = V) :

```json
{
  "debut": ["craquement", "vent", "horloge"],
  "milieu": ["pas-dans-lescalier", "coups", "murmure"],
  "fin": ["cri-lointain", "porte-qui-claque", "cloche"]
}
```

- Un nom sans extension : le plateau cherche `nom.wav`, puis `.mp3`, `.m4a`, `.ogg`. Vous pouvez aussi écrire l'extension : `cri.wav`.
- Si `effets.json` existe, **seuls les sons qu'il liste** sont joués. Un moment laissé vide reprend la liste « tous », ou les huit bruits de base.
- Un nom dont le fichier est absent est **ignoré sans erreur** (sauf s'il porte le nom d'un bruit de base, qui est alors fabriqué par l'iPad).
- Dans le plateau, **Voix de la maison → Essayer les bruits de la maison** montre un bouton par son de votre liste, pour les écouter un par un.

## Conseils pour de bons fichiers

- **Courts** : 2 à 10 secondes. Un bruit long finit par recouvrir les voix.
- **Pas de silence** au début ni à la fin (rognez-les dans CapCut), sinon le bruit paraît en retard.
- **Même niveau sonore** pour tous : un son trop fort fait sursauter pour de mauvaises raisons. Les voix de Sally et l'ambiance sont réglées pour passer devant.
- **Légers** : en WAV, enregistrez en **mono, 16 bits, 44,1 kHz** : une seconde fait environ 90 Ko, donc visez moins de 6 secondes par fichier (moins de 500 Ko). Les stéréo ou 24 bits pèsent deux à trois fois plus : à convertir dans CapCut ou Audacity.
- Pas de nom avec espace ni accent : `porte-qui-claque.mp3`, pas `Porte qui claque.mp3`.
- N'utilisez que des sons dont vous avez les droits.

## Publier

Copiez les fichiers dans le dossier `assets/audio/effets` du dépôt GitHub `tu-etais-la` (GitHub Desktop → Repository → Show in Explorer), puis Commit et Push. Attendez une minute, puis fermez et rouvrez la page de l'iPad.

## Les autres fichiers audio de la tablette acceptent aussi le WAV

- Musique d'ambiance : `assets/audio/ambiance.mp3` **ou** `ambiance.wav` (lue en boucle). Un WAV long est lourd : un morceau de 2 minutes en mono 16 bits fait environ 10 Mo. Préférez un MP3 pour la musique.
- Voix de Sally : `assets/audio/ACCUEIL_SALLY.mp3` ou `.wav`, et `COMMUN_SALLY_EVENEMENT_preuve.mp3` ou `.wav`.
