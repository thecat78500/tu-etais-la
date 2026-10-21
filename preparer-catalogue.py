import json
from pathlib import Path
root=Path(__file__).resolve().parent
affaires=json.loads((root/'audio-scripts/bibliotheque-v2/scenarios.json').read_text(encoding='utf-8'))
images=['affaire-01-reserve.png','affaire-02-depart.png','affaire-03-escalier.png','affaire-04-lampe.png','affaire-05-montre.png','affaire-06-photo-reutilisee.png','affaire-07-vue-camera.png','affaire-08-secretaire.png','affaire-09-invitations.png','affaire-10-photo-complete.png']
catalogue=[{key:a[key] for key in ['id','title','motif','intro']}|{'image':'assets/'+images[a['id']-1]} for a in affaires]
for a in catalogue:assert (root/a['image']).is_file()
(root/'catalogue-affaires.json').write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Catalogue public de dix affaires préparé, sans canon privé ni solution.')
