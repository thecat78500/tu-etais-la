// Démonstration locale : aucun rôle privé ni portrait n'est transmis à un service.
let lobby={created:false,started:false,count:6,guests:[],id:''};
// Composition publique prévue ; aucune identité de camp n'est attribuée côté iPad.
const campDistribution={4:[2,1,1],5:[3,1,1],6:[3,2,1],7:[4,2,1],8:[4,2,2],9:[5,2,2],10:[5,3,2]};
let previewUrl=null;
function refreshLobby(){
 const [good,evil,ambiguous]=campDistribution[lobby.count];
 document.querySelector('#camp-balance').textContent=`${good} gentils · ${evil} méchant${evil>1?'s':''} · ${ambiguous} ambigu${ambiguous>1?'s':''}`;
 const list=document.querySelector('#guest-roster');list.replaceChildren();
 for(let i=0;i<lobby.count;i++){
  const guest=lobby.guests[i],card=document.createElement('article');card.className='guest-card'+(guest?' joined':'');
  const portrait=document.createElement('div');portrait.className='guest-portrait';
  if(guest?.url){const image=document.createElement('img');image.src=guest.url;image.alt='Portrait de '+guest.name;portrait.append(image)}else portrait.textContent=guest?guest.name.slice(0,1).toLocaleUpperCase():'0'+(i+1);
  const caption=document.createElement('div'),name=document.createElement('strong'),status=document.createElement('span');name.textContent=guest?guest.name:'Place réservée';status.textContent=guest?'● PRÊT À JOUER':'EN ATTENTE';caption.append(name,status);card.append(portrait,caption);list.append(card);
 }
 document.querySelector('#guest-counter').textContent=`${lobby.guests.length} / ${lobby.count}`;
 document.querySelector('#add-guest').disabled=!lobby.created||lobby.started||lobby.guests.length>=lobby.count;
 document.querySelector('#start-session').disabled=!lobby.created||lobby.started||lobby.guests.length!==lobby.count;
 document.querySelector('#end-session').hidden=!lobby.created;
 document.querySelector('#guest-count').disabled=lobby.created;
 document.querySelector('#create-session').disabled=lobby.created;
 document.querySelector('#session-state').textContent=lobby.started?'Partie démo lancée. Aucun message Telegram envoyé.':lobby.created?`Session ${lobby.id} · ${lobby.guests.length===lobby.count?'Tout le monde est prêt.':'En attente des invités.'}`:'Aucune partie créée.';
}
document.querySelector('#session-form').addEventListener('submit',event=>{event.preventDefault();if(lobby.created)return;lobby.count=Number(document.querySelector('#guest-count').value);if(![4,5,6,7,8,9,10].includes(lobby.count))return;lobby.created=true;lobby.id='TEL-'+crypto.randomUUID().slice(0,6).toUpperCase();refreshLobby()});
document.querySelector('#guest-count').addEventListener('change',event=>{if(!lobby.created){lobby.count=Number(event.target.value);refreshLobby()}});
function clearPreview(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;const img=document.querySelector('#guest-preview');img.hidden=true;img.removeAttribute('src')}
document.querySelector('#add-guest').addEventListener('click',()=>{if(!lobby.created||lobby.started||lobby.guests.length>=lobby.count)return;document.querySelector('#guest-form').reset();document.querySelector('#guest-error').textContent='';clearPreview();document.querySelector('#guest-dialog').showModal()});
document.querySelector('#guest-photo').addEventListener('change',async event=>{
 clearPreview();const file=event.target.files[0],error=document.querySelector('#guest-error');error.textContent='';if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){error.textContent='Choisissez une photo JPG, PNG ou WebP de moins de 5 Mo.';event.target.value='';return}
 const candidate=URL.createObjectURL(file),probe=new Image();try{probe.src=candidate;await probe.decode();if(event.target.files[0]!==file){URL.revokeObjectURL(candidate);return}previewUrl=candidate;const img=document.querySelector('#guest-preview');img.src=previewUrl;img.hidden=false}catch{URL.revokeObjectURL(candidate);event.target.value='';error.textContent='Cette image ne peut pas être lue. Essayez une autre photo.'}
});
document.querySelector('#guest-form').addEventListener('submit',event=>{
 event.preventDefault();if(!lobby.created||lobby.started||lobby.guests.length>=lobby.count)return;
 const input=document.querySelector('#guest-name'),name=input.value.trim();if(!name){input.setCustomValidity('Indiquez votre prénom.');input.reportValidity();return}
 lobby.guests.push({name,url:previewUrl});previewUrl=null;document.querySelector('#guest-preview').removeAttribute('src');document.querySelector('#guest-dialog').close();refreshLobby();
});
document.querySelector('#guest-name').addEventListener('input',event=>event.target.setCustomValidity(''));
document.querySelector('#guest-dialog').addEventListener('close',clearPreview);
document.querySelector('#start-session').addEventListener('click',()=>{if(!lobby.created||lobby.started||lobby.guests.length!==lobby.count)return;lobby.started=true;refreshLobby();document.querySelector('[data-tab="messages"]').click()});
document.querySelector('#end-session').addEventListener('click',()=>{lobby.guests.forEach(guest=>{if(guest.url)URL.revokeObjectURL(guest.url)});clearPreview();lobby={created:false,started:false,count:Number(document.querySelector('#guest-count').value),guests:[],id:''};refreshLobby()});
// app.js est différé ; l'initialisation du premier onglet suit son exécution.
window.addEventListener('DOMContentLoaded',()=>{refreshLobby();document.querySelector('[data-tab="setup"]').click()});
document.querySelector('#elise-portrait').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">DOSSIER 014 / PORTRAIT DE RÉFÉRENCE</span><h2>Sally Hardesty</h2><img class="elise-enlarged" src="assets/elise-morel.png" alt="Portrait d’Sally Hardesty"><p>Vous vous souvenez de son visage.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#reserve-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 01 / APERÇU DE LA RÉSERVE</span><h2>La porte qu’on n’a pas ouverte</h2><img class="evidence-photo" src="assets/affaire-01-reserve.png" alt="Une porte fermée vue depuis la réserve et une chaise renversée"><a class="original-photo" href="assets/affaire-01-reserve.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Une chaise renversée. Une lumière sous la porte. Cette photographie appartient au premier scénario ; elle ne permet pas, à elle seule, de déterminer ce qui s’est passé.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#depart-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 02 / APERÇU DU DÉPART</span><h2>Celle qui avait prévu de disparaître</h2><img class="evidence-photo" src="assets/affaire-02-depart.png" alt="Valise ouverte sur un lit, vêtements pliés et enveloppe"><a class="original-photo" href="assets/affaire-02-depart.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Des vêtements soigneusement pliés. Une enveloppe. Un manteau laissé sur une chaise. Ces objets suggèrent des préparatifs, sans établir à eux seuls les raisons du départ.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#escalier-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 03 / APERÇU DE L’ESCALIER</span><h2>Le téléphone de trop</h2><img class="evidence-photo" src="assets/affaire-03-escalier.png" alt="Rampe cassée dans un escalier ancien, débris sur une marche"><a class="original-photo" href="assets/affaire-03-escalier.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>La rampe est brisée près de son support. Le mur est abîmé autour des fixations et des débris reposent sur une marche. L’image seule ne permet pas de dater ces dégâts ni de déterminer leur cause.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#lampe-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 04 / APERÇU DU SALON</span><h2>Vous avez tous la même mémoire</h2><img class="evidence-photo" src="assets/affaire-04-lampe.png" alt="Lampe à abat-jour vert, verres et fauteuil dans le salon de la soirée"><a class="original-photo" href="assets/affaire-04-lampe.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Un instant de la soirée dans le salon. Certains détails de cette photographie pourront être comparés aux témoignages.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#montre-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 05 / APERÇU DE L’OBJET DISSIMULÉ</span><h2>Le pacte ne parlait pas de Sally</h2><img class="evidence-photo" src="assets/affaire-05-montre.png" alt="Montre de poche rayée avec une marque triangulaire, dans un coffret ouvert"><a class="original-photo" href="assets/affaire-05-montre.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Un coffret ouvert dans un placard. Une montre de poche et sa chaîne reposent sur un tissu sombre. Une marque triangulaire distingue son couvercle. L’image seule ne permet pas de déterminer son propriétaire ni la raison de sa présence ici.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#sally-photo-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 06 / APERÇU DE LA PHOTOGRAPHIE</span><h2>Quelqu’un joue Sally</h2><img class="evidence-photo" src="assets/affaire-06-photo-reutilisee.png" alt="Sally tient une tasse ébréchée dans le jardin, un pot cassé se trouve à côté"><a class="original-photo" href="assets/affaire-06-photo-reutilisee.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Sally dans le jardin de la maison. Une tasse ébréchée et un pot cassé offrent des détails à comparer. La photographie seule ne permet pas de déterminer quand elle a été prise.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#synchro-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 07 / COMPARAISON DES APERÇUS</span><h2>Les douze minutes manquantes</h2><div class="comparison-images"><figure><figcaption>Vue A · caméra en hauteur</figcaption><img class="evidence-photo" src="assets/affaire-07-vue-camera.png" alt="Vue en hauteur du jardin : guirlande partiellement éteinte et homme près d’une chaise renversée"><a class="original-photo" href="assets/affaire-07-vue-camera.png" target="_blank" rel="noopener">Agrandir la vue A ↗</a></figure><figure><figcaption>Vue B · depuis la table, version corrigée</figcaption><img class="evidence-photo" src="assets/affaire-07-vue-telephone-v2.png" alt="Vue depuis la table : guirlande et homme près d’une chaise renversée"><a class="original-photo" href="assets/affaire-07-vue-telephone-v2.png" target="_blank" rel="noopener">Agrandir la vue B ↗</a></figure></div><p>La vue depuis la table a été retouchée pour rapprocher la nuit, les éclairages et les invités de la vue en hauteur. Les détails ne sont pas une reconstruction géométrique exacte : la chaise fournit un repère commun, mais le nombre précis des ampoules ne doit pas servir de code. Les horaires de scénario restent à définir.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#secretaire-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 08 / APERÇU DU SECRÉTAIRE</span><h2>La clé n’ouvrait pas cette porte</h2><img class="evidence-photo" src="assets/affaire-08-secretaire.png" alt="Une clé à panneton posée devant la serrure d’un tiroir fermé"><a class="original-photo" href="assets/affaire-08-secretaire.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Un tiroir fermé. Une clé posée devant sa serrure. La photographie permet de comparer leurs formes, mais ne prouve pas à elle seule que le mécanisme peut être ouvert avec cette clé.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#invitations-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 09 / APERÇU DES INVITATIONS</span><h2>Personne ne devait être absent</h2><img class="evidence-photo" src="assets/affaire-09-invitations.png" alt="Enveloppes aux sceaux rouge et noir brisés, cartons vierges sur la console"><a class="original-photo" href="assets/affaire-09-invitations.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Deux enveloppes ouvertes, deux sceaux différents et des cartons sans inscription. Les destinataires et les horaires seront présentés dans des documents séparés, lisibles sur la tablette.</p>';
 document.querySelector('#detail').showModal();
});
document.querySelector('#photo-complete-preview').addEventListener('click',()=>{
 document.querySelector('#detail-content').innerHTML='<span class="tiny">AFFAIRE 10 / APERÇU DU CADRE COMPLET</span><h2>Le dossier que vous avez fabriqué</h2><img class="evidence-photo" src="assets/affaire-10-photo-complete.png" alt="Sally et un invité échangent un téléphone dans le salon, sous le regard des autres convives"><a class="original-photo" href="assets/affaire-10-photo-complete.png" target="_blank" rel="noopener">Ouvrir l’image originale pour zoomer ↗</a><p>Un téléphone entre deux mains. Le cadre complet conserve le contexte du geste. Une photographie isolée ne permet pas de déterminer le sens du mouvement ni ce qui a été dit.</p>';
 document.querySelector('#detail').showModal();
});





