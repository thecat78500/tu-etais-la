# Scènes de l'affaire 1 — 28 octobre 2026

Neuf images fixes créées avec l'outil intégré imagegen. Pas d'API payante séparée, pas de génération au cours d'une partie. Les PNG sélectionnés sont enregistrés dans ce dossier. La photo du premier sceau reste `assets/preuves/affaire-01/reserve-vide.png`.

## Direction et prompts de création

Référence commune : photographie existante de la réserve. Image cinématographique photoréaliste, paysage 4:3, maison ancienne française, maçonnerie rectangulaire et linteau en bois, enduit gris-vert, panneau écarté à droite, étagères et bocaux, plancher poussiéreux. Conserver ces repères et des ombres lisibles sur iPad. Pas de texte incrusté, d'interface, de filigrane, de code de réponse ni de symbole indiquant la bonne porte.

| Fichier | Demande de scène et contraintes particulières |
|---|---|
| sceau-02-passage.png | Rapprocher la caméra du renfoncement fermé, lumière rasante chaude, détails des joints et traces du panneau dans la poussière. Aucun passage ouvert ni nouvel indice ajouté. |
| sceau-03-envers.png | Même réserve du point de vue de Sally dans l'envers ; lumière bleu ardoise, brume au sol, profondeur inquiétante, pièces reconnaissables. Pas de personne visible ni chemin de solution représenté. |
| sceau-04-protection.png | Passage de retour encore fermé du côté de l'envers ; lumière ambrée continue autour de la maçonnerie, frontière protectrice intacte. Ni runes, ni procédure de résolution dessinée. |
| sceau-05-portes.png | Pièce avec exactement cinq portes de même taille et de même importance. Référence de matière : porte-lune.png existante. De gauche à droite : lune, cendres, ronce, éclat de verre et seuil. Aucune porte favorisée ou ouverte. |
| fin-01-sally.png | Sally adulte fictive revient vers le groupe dans la réserve, soulagée, émue et souriante, seuil lumineux chaud, entité absente. |
| fin-02-entite.png | Présence informe de fumée noire déjà passée de notre côté du seuil, ombre avançant vers la caméra, lumière froide ; Sally non secourue et non représentée. Sans gore ni démon caricatural. |
| fin-03-scellee.png | Seuil fermé par une porte barrée de fer, filet de lumière froide sous la porte, sécurité de notre côté et tristesse du non-retour. Aucune silhouette sortie. |
| fin-04-enfermes.png | Vue depuis l'intérieur enfermé, porte ordinaire se refermant sur un mince filet de lumière, ambiance rouge sombre et charbon. Sans emblème de porte, ni sortie possible montrée. |
| fin-05-silence.png | Le renfoncement s'est effacé dans un mur plein, seule une cicatrice rectangulaire subsiste. Pièce vide, poussière immobile, gris cendré et ombre douce, ni porte ni personne. |

Les scènes représentent une progression narrative, pas de nouvelles preuves variables. La géométrie matérielle de la première photographie reste la référence officielle ; les modifications surnaturelles apparaissent dans l'envers et les conclusions. L'image finale dépend de `progression.portes.resultat.issue`, jamais du nom de la porte ni du camp supposé à partir d'un prénom.

## Intégration

`plateau.js` choisit le sceau actif public, puis l'issue révélée à la conclusion, uniquement pour scenario_id=1. Les autres affaires gardent leurs illustrations. Le vote, les rôles, les preuves privées et les fichiers audio sont conservés. Version 12 dans la régie, paramètres de cache mis à jour dans ecran.html.

Contrôles : `node prototypes/affaire-01/verifier-scenes.cjs`, `node prototypes/affaire-01/verifier-plateau-preuves.cjs`, `node verify-plateau.cjs`. Captures dans `captures/scenes/`. Aperçu sans serveur de jeu : `prototypes/affaire-01/scenes-reference.html`, menu des cinq sceaux et cinq fins.
