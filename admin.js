(()=>{
 const $=s=>document.querySelector(s),form=$('#media-form');
 let records=[],editing=null,fileBlob=null,previewURL=null,listURLs=[],decoding=false;
 const caseName=value=>Number(value)===0?'Images communes':`Affaire ${String(value).padStart(2,'0')}`;
 function status(message,error=false){$('#media-status').textContent=message;$('#media-status').dataset.error=String(error)}
 function preview(blob){if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;$('#media-preview').hidden=!blob;if(blob){previewURL=URL.createObjectURL(blob);$('#media-preview').src=previewURL}else $('#media-preview').removeAttribute('src')}
 function reset(){form.reset();editing=null;fileBlob=null;preview(null);$('#editor-title').textContent='Une nouvelle image';$('#media-save').textContent='Ajouter à la bibliothèque ↗';$('#media-cancel').hidden=true;$('#media-title').setCustomValidity('')}
 async function refresh(){records=await gameMedia.all();render()}
 function render(){
  listURLs.forEach(url=>URL.revokeObjectURL(url));listURLs=[];
  const list=$('#media-list');list.replaceChildren();const filter=$('#media-filter').value;
  const matching=records.filter(record=>filter==='trash'?record.trashed:!record.trashed&&(filter==='active'||String(record.caseId)===filter)).sort((a,b)=>b.createdAt-a.createdAt);
  $('#media-count').textContent=`${matching.length} image${matching.length>1?'s':''}`;
  if(!matching.length){const empty=document.createElement('p');empty.className='media-empty';empty.textContent=filter==='trash'?'La corbeille est vide.':records.some(r=>!r.trashed)?'Aucune image pour cette affaire.':'Votre bibliothèque est vide. Ajoutez votre première image à gauche.';list.append(empty);return}
  matching.forEach(record=>{
   const card=document.createElement('article');card.className='media-card';card.dataset.id=record.id;
   const open=document.createElement('button');open.type='button';open.className='media-open';open.setAttribute('aria-label','Agrandir : '+record.title);
   const url=URL.createObjectURL(record.blob);listURLs.push(url);const image=document.createElement('img');image.src=url;image.alt=record.title;image.loading='lazy';const title=document.createElement('h3');title.textContent=record.title;open.append(image,title);open.addEventListener('click',()=>show(record));
   const label=document.createElement('span');label.className='tiny';label.textContent=caseName(record.caseId);
   const description=document.createElement('p');description.textContent=record.description;
   const actions=document.createElement('div');actions.className='media-actions';
   function action(text,handler){const button=document.createElement('button');button.type='button';button.textContent=text;button.addEventListener('click',async()=>{button.disabled=true;try{await handler()}catch(error){status('Action impossible. Votre image est conservée ; réessayez.',true)}finally{button.disabled=false}});actions.append(button)}
   if(record.trashed)action('Restaurer',async()=>{await gameMedia.put({...record,trashed:false});await refresh();status('Image restaurée.')});
   else{
    action('Modifier',()=>{reset();editing=record.id;fileBlob=record.blob;$('#media-title').value=record.title;$('#media-case').value=String(record.caseId);$('#media-description').value=record.description;preview(record.blob);$('#editor-title').textContent='Modifier cette image';$('#media-save').textContent='Enregistrer les modifications ↗';$('#media-cancel').hidden=false;status('Vous pouvez changer le titre, l’affaire ou remplacer le fichier.');$('#media-title').focus()});
    action('Retirer',async()=>{await gameMedia.put({...record,trashed:true});if(editing===record.id)reset();await refresh();status('Image placée dans la corbeille. Vous pouvez la restaurer.')});
   }
   const download=document.createElement('a');download.href=url;download.download=record.filename;download.textContent='Télécharger';actions.append(download);card.append(open,label,description,actions);list.append(card);
  });
 }
 let dialogURL=null;
 function show(record){if(dialogURL)URL.revokeObjectURL(dialogURL);dialogURL=URL.createObjectURL(record.blob);$('#media-dialog-title').textContent=record.title;$('#media-dialog-image').src=dialogURL;$('#media-dialog-image').alt=record.title;$('#media-dialog-description').textContent=record.description;$('#media-dialog').showModal()}
 $('#media-dialog .close').addEventListener('click',()=>$('#media-dialog').close());$('#media-dialog').addEventListener('close',()=>{if(dialogURL)URL.revokeObjectURL(dialogURL);dialogURL=null;$('#media-dialog-image').removeAttribute('src')});
 $('#media-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024){status('Choisissez une image JPG, PNG ou WebP de 15 Mo maximum.',true);event.target.value='';return}
  decoding=true;$('#media-save').disabled=true;const url=URL.createObjectURL(file),probe=new Image();
  try{probe.src=url;await probe.decode();if(event.target.files[0]!==file)return;fileBlob=file;preview(file);if(!$('#media-title').value)$('#media-title').value=file.name.replace(/\.[^.]+$/,'').slice(0,100);status('Image prête à être enregistrée.')}
  catch{status('Ce fichier image ne peut pas être lu. Choisissez un autre fichier.',true);event.target.value=''}
  finally{URL.revokeObjectURL(url);decoding=false;$('#media-save').disabled=false}
 });
 $('#media-title').addEventListener('input',event=>event.target.setCustomValidity(''));
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(decoding)return;const title=$('#media-title').value.trim();if(!title){$('#media-title').setCustomValidity('Indiquez un titre.');$('#media-title').reportValidity();return}if(!fileBlob){status('Choisissez une image à importer.',true);return}
  const caseId=Number($('#media-case').value);if(!Number.isInteger(caseId)||caseId<0||caseId>10)return;
  $('#media-save').disabled=true;
  try{const previous=records.find(record=>record.id===editing);await gameMedia.put({id:editing||crypto.randomUUID(),title,description:$('#media-description').value.trim(),caseId,blob:fileBlob,filename:fileBlob.name||previous?.filename||'image.png',createdAt:previous?.createdAt||Date.now(),trashed:false});reset();await refresh();status('Image enregistrée sur cet appareil. Elle est disponible dans le jeu.')}
  catch{status('Enregistrement impossible : vérifiez que le stockage du navigateur est autorisé et dispose de place. Votre sélection reste disponible pour réessayer.',true)}
  finally{$('#media-save').disabled=false}
 });
 $('#media-cancel').addEventListener('click',()=>{reset();status('Modification annulée.')});$('#media-filter').addEventListener('change',render);
 refresh().catch(()=>{status('Le stockage local est indisponible. Ouvrez cette page hors navigation privée et autorisez le stockage du site.',true)});
})();
