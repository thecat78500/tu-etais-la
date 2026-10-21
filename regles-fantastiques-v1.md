# Tu Étais Là — règles fantastiques, cinq énigmes

Spécification de conception, pas encore intégrée au prototype. Évolution demandée : une partie comporte exactement cinq énigmes renouvelables ; les rôles des participants changent entre les parties. Les dix trames antérieures restent des idées d’affaires, pas une obligation de changer de scénario à chaque session.

## But commun

Quatre à dix personnes explorent la disparition de Sally et le passage ouvert dans la maison. Des camps secrets opposent désormais leurs objectifs : les gentils cherchent à refermer le passage, les méchants servent la présence et les ambigus poursuivent un intérêt personnel. Aucune élimination. Les souvenirs et les tentations concernent des personnages fictifs.

## Camps secrets et effectif

Répartition initiale de conception, à équilibrer en essais réels. Contrainte confirmée : le nombre d’ambigus ne doit jamais dépasser le nombre de méchants.

| Joueurs | Gentils | Méchants | Ambigus |
|---|---:|---:|---:|
| 4 | 2 | 1 | 1 |
| 5 | 3 | 1 | 1 |
| 6 | 3 | 2 | 1 |
| 7 | 4 | 2 | 1 |
| 8 | 4 | 2 | 2 |
| 9 | 5 | 2 | 2 |
| 10 | 5 | 3 | 2 |

Chaque joueur possède deux informations secrètes distinctes : sa fonction (Médium, Gardien, etc.) et son camp. Les deux tirages varient entre les parties. Aucune fonction ne garantit la loyauté du personnage. La répartition numérique est publique, les identités restent privées. Pour la première version, les méchants ne connaissent pas automatiquement les autres méchants ; les règles ne nécessitent donc pas de canal de discussion secret entre eux.

Les gentils cherchent à comprendre les preuves et refermer le passage. Les méchants cherchent à faire choisir une mauvaise issue par le mensonge et la persuasion ; ils ne peuvent pas effacer les preuves, monopoliser la tablette ou empêcher la progression. Les ambigus reçoivent un objectif personnel précis, vérifiable et atteignable avec au moins une des issues finales. Il peut les conduire à aider un camp ; ils ne constituent pas automatiquement une troisième équipe et ne changent pas les quotas en cours de partie.

Le déroulement comporte toujours cinq énigmes. Les quatre premières restent franchissables avec des relances si quelqu’un cache son indice. La cinquième comporte le choix collectif irréversible du rituel ; toutes ses informations nécessaires doivent pouvoir être vérifiées dans les archives. Les joueurs restent libres de voter contre la solution déduite, au bénéfice de la présence. Les règles de vote, d’égalité et les critères des objectifs ambigus doivent être écrits avant le test.

Cette évolution remplace la proposition antérieure où tous les joueurs avaient le même objectif. Le prototype iPad n’affiche que les effectifs prévus : la distribution secrète des camps et les conditions finales ne sont pas encore implémentées.

On peut parler librement, cacher un message ou mentir sur son contenu. On ne peut pas inventer une preuve fournie par le jeu. Les messages privés ne sont pas montrés, sauf autorisation explicite. Les preuves ouvertes sur l’iPad sont communes. Aucune énigme ne dépend de l’apparence réelle des invités, ni d’informations privées non fournies pour la partie.

## Rôles

Quatre fonctions sont toujours présentes et attribuées secrètement, au hasard :

- Le Médium reçoit des fragments de voix ou leurs transcriptions.
- Le Veilleur perçoit des détails visuels et des signes cachés.
- Le Gardien connaît les propriétés des objets et des seuils.
- Le Revenant possède des souvenirs de ce qui est arrivé à Sally.

Chaque rôle apporte des informations différentes à chaque énigme, sans règles de pouvoir à mémoriser. Les quatre fonctions essentielles restent présentes. Ajouter dans cet ordre les fonctions complémentaires selon le nombre de joueurs :

| Joueurs | Rôle ajouté | Informations personnelles |
|---|---|---|
| 5 | L’Archiviste | Origine des documents, dates et versions anciennes |
| 6 | L’Écho | Seconde partie de paroles ou de messages incomplets |
| 7 | Le Cartographe | Plans, passages et relations entre les pièces |
| 8 | Le Porteur | Marques et inscriptions portées par les objets |
| 9 | Le Scribe | Fragments d’alphabet, correspondances et signes à déchiffrer |
| 10 | Le Témoin | Détails observés pendant la soirée et gestes manquants dans les autres récits |

Les personnages réels sont attribués au hasard aux invités : le tableau indique la composition du groupe, pas l’ordre d’arrivée. Chaque personne doit recevoir un fragment distinct et utile à chacune des cinq énigmes. Les tâches d’observation et de synthèse sont également réparties. Le nombre d’énigmes reste cinq, quel que soit le groupe.

Préparer un paquet d’indices pour chacun des effectifs de quatre à dix : un grand paquet simplement amputé laisserait des informations manquantes. À dix, découper les informations en fragments courts et complémentaires et faire circuler la parole avant la saisie collective. Les relances fournissent une seconde voie de découverte si un joueur reste silencieux, sans modifier la solution.

Les rôles et le paquet d’indices sont déterminés ensemble au début de la session. Aucun rôle ne change au milieu d’une partie. Éviter de redonner à une personne son rôle précédent si les données de la session précédente sont disponibles, sans promettre une absence infinie de répétitions.

## Les cinq énigmes

1. **Le message de Sally.** Reconstituer une phrase à partir de fragments reçus en privé. Les liens entre fragments et quelques repères sur l’iPad donnent un ordre unique. La phrase et son découpage varient.
2. **Les marques sur la porte.** Placer des symboles dans le bon ordre en croisant les observations et les contraintes des rôles. La séquence, les symboles et les contraintes changent. Le générateur doit vérifier qu’une seule séquence satisfait tous les indices.
3. **Les objets du pacte.** Associer des objets à des souvenirs ou à des emplacements. Chaque rôle détient une partie des correspondances et des exclusions. Les associations changent, mais jamais les faits matériels visibles dans les images originales. Les symboles variables sont ajoutés dans des documents séparés ou en surimpression clairement lisible.
4. **L’heure où tout a basculé.** Reconstituer l’ordre d’événements grâce aux souvenirs, messages et horodatages de la session. Les décalages d’horloge sont explicitement déductibles de repères indépendants. Chaque jeu de paramètres doit avoir une solution unique. Ne pas fonder une égalité d’instant sur le nombre d’ampoules des deux images de l’affaire 7, dont les détails ne correspondent pas exactement.
5. **Le rituel du retour.** Déduire le nom rituel, l’objet et la porte à partir des résultats précédents et de derniers fragments privés. Les quatre premières réponses sont consignées automatiquement dans un carnet partagé. Aucun nouveau savoir externe n’est requis. La combinaison finale est vérifiée avant distribution.

La cinquième énigme constitue la résolution finale : ne pas ajouter une sixième énigme après elle. Une courte révélation et un débrief suivent.

## Une étape de jeu

Le bot annonce la situation, distribue les fragments personnels et ouvre les documents communs sur l’iPad. Les joueurs discutent, puis saisissent une réponse commune. La validation ouvre l’étape suivante. Tous jouent simultanément, sans tour individuel.

Une mauvaise réponse n’élimine personne et permet de réessayer. L’ambiance peut devenir plus inquiétante, mais ne doit pas effacer les indices nécessaires. Un bouton permet de demander successivement une orientation puis un indice plus explicite. En cas de blocage persistant, une aide de résolution permet de continuer. Les cinq énigmes restent accessibles à tous les groupes.

La résolution du rituel détermine le camp victorieux : les gentils gagnent si le passage est refermé, les méchants si le choix final laisse entrer la présence. Les ambigus réussissent ou échouent selon leur objectif personnel annoncé en privé. Une résolution accompagnée reste une victoire possible : demander des indices ne décide pas du résultat. Durée indicative à tester : 60 à 75 minutes, installation et débrief compris ; aucune limite rigide n’est requise pour le premier essai.

## Renouvellement

La structure des cinq étapes reste familière. Chaque nouvelle session tire un paquet cohérent de paramètres et réattribue les rôles : phrases, symboles, associations, horaires, indices personnels et combinaison finale peuvent varier. Les personnages, les visuels d’ambiance et le cadre narratif peuvent rester identiques.

Échanger seulement les destinataires de messages identiques permet de redécouvrir un point de vue mais laisse les réponses connues. La rejouabilité exige donc le renouvellement des paramètres en plus de celui des rôles. Les mécaniques resteront reconnaissables et les joueurs expérimentés pourront progresser plus vite.

Pour le premier prototype jouable, préparer plusieurs variantes écrites et vérifiées plutôt que compter sur une improvisation libre de l’IA. Ensuite, une génération contrainte pourra produire d’autres instances. La solution, les contraintes et les indices doivent être validés avant le départ. L’IA pourra varier la mise en scène, sans changer la solution en cours de partie.

Toutes les données secrètes devront rester côté serveur. La bibliothèque de préparation actuelle est publique et locale ; elle ne constitue pas un coffre pour les solutions ou les rôles.
