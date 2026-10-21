(()=>{
 const $=selector=>document.querySelector(selector);let clips=[],recordings=[],urls=[],busy=false;
 const variant=()=>$('#studio-version').value;
 const recordFor=clip=>recordings.find(r=>r.key===clip.id+'::'+variant());
 function message(text,error=false){$('#studio-status').textContent=text;$('#studio-status').dataset.error=String(error)}
 async function copy(value){try{await navigator.clipboard.writeText(value);message('Copié. Vous pouvez coller dans ElevenLabs.')}catch{message('La copie automatique est indisponible. Sélectionnez le texte ci-dessous puis copiez-le.',true)}}
 const extension=file=>file.name.split('.').pop().toLowerCase();
 async function inspect(file){
  if(!['mp3','m4a','wav','ogg'].includes(extension(file))||file.size>30*1024*1024||file.size===0)throw Error('Choisissez un fichier MP3, M4A, WAV ou OGG lisible, de 30 Mo maximum.');
  const url=URL.createObjectURL(file),audio=new Audio();
  try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{audio.removeAttribute('src');audio.load();reject(Error('Impossible de lire ce fichier audio. Essayez un export MP3.'))},12000);audio.onloadedmetadata=()=>{clearTimeout(timer);Number.isFinite(audio.duration)&&audio.duration>0?resolve(audio.duration):reject(Error('Durée audio invalide.'))};audio.onerror=()=>{clearTimeout(timer);reject(Error('Ce fichier ne peut pas être décodé par ce navigateur.'))};audio.preload='metadata';audio.src=url})}finally{audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url)}
 }
 async function save(clip,file,version){const duration=await inspect(file);await gameAudio.put({key:clip.id+'::'+version,clipId:clip.id,version,blob:file,originalName:file.name,extension:extension(file),duration,updatedAt:Date.now()})}
 async function loadRecordings(){recordings=await gameAudio.all()}
 async function importOne(clip,file){if(busy)return;busy=true;const version=variant();message('Vérification et enregistrement du fichier…');try{await save(clip,file,version);await loadRecordings();const scrollY=window.scrollY;render();window.scrollTo(0,scrollY);message('Audio importé et conservé sur cet appareil : '+clip.filename+' · '+(version==='clean'?'voix seule':'filtre téléphone')+'.')}catch(error){message(error.message||'Enregistrement impossible. Vérifiez la place disponible dans le navigateur.',true)}finally{busy=false}}
 function render(){
  urls.forEach(url=>URL.revokeObjectURL(url));urls=[];
  const version=variant(),voiceClips=clips.filter(c=>c.voice===$('#studio-voice').value),allImported=voiceClips.filter(recordFor).length;
  $('#studio-progress').textContent=`${allImported} / ${voiceClips.length} enregistrements importés pour cette voix et cette version`;
  const selected=voiceClips.filter(c=>($('#studio-case').value==='all'||String(c.scenario_id||0)===$('#studio-case').value)&&($('#studio-completion').value==='all'||($('#studio-completion').value==='ready'?!!recordFor(c):!recordFor(c))));
  $('#studio-list').replaceChildren();message(selected.length+' scripts affichés. Importez le fichier sous le texte correspondant.');
  if(!selected.length){const p=document.createElement('p');p.className='storage-note';p.textContent='Aucun script ne correspond à ces filtres.';$('#studio-list').append(p)}
  for(const clip of selected){
   const record=recordFor(clip),card=document.createElement('article');card.className='voice-script';card.dataset.clip=clip.id;
   const h=document.createElement('h2'),meta=document.createElement('p'),actions=document.createElement('div'),pre=document.createElement('pre'),badge=document.createElement('span');
   h.textContent=clip.filename;badge.className='recording-badge'+(record?' ready':'');badge.textContent=record?'● IMPORTÉ · '+Math.round(record.duration)+' s':'À PRODUIRE';
   meta.textContent=(clip.channel==='ipad_public'?'iPad — collectif':'Telegram — privé')+' · '+(clip.role||clip.camp||'Destinataire défini par le déroulement')+' · durée du script estimée '+clip.estimated_seconds+' s';actions.className='media-actions';
   for(const [label,value]of [['Copier le texte',clip.elevenlabs_text],['Copier le nom du MP3',clip.filename]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>copy(value));actions.append(b)}
   pre.textContent=clip.elevenlabs_text;
   const upload=document.createElement('div');upload.className='recording-upload';const label=document.createElement('label'),input=document.createElement('input');input.type='file';input.accept='.mp3,.m4a,.wav,.ogg,audio/mpeg,audio/mp4,audio/wav,audio/ogg';input.id='upload-'+clip.id;label.htmlFor=input.id;label.textContent=record?'Remplacer cet enregistrement':'Importer cet enregistrement';input.addEventListener('change',()=>{const file=input.files[0];if(file)importOne(clip,file)});upload.append(label,input);
   card.append(h,badge,meta,actions,pre,upload);
   if(record){const audio=document.createElement('audio'),url=URL.createObjectURL(record.blob);urls.push(url);audio.src=url;audio.controls=true;audio.preload='none';audio.setAttribute('aria-label','Écouter '+clip.filename);audio.addEventListener('play',()=>document.querySelectorAll('#studio-list audio').forEach(other=>{if(other!==audio)other.pause()}));const name=document.createElement('p');name.textContent='Fichier reçu : '+record.originalName;const download=document.createElement('a');download.href=url;download.download=clip.id+(version==='phone'?'_phone':'')+'.'+record.extension;download.textContent='Télécharger la copie sauvegardée ↗';download.className='audio-download';card.append(audio,name,download)}
   $('#studio-list').append(card);
  }
 }
 ['#studio-voice','#studio-case','#studio-version','#studio-completion'].forEach(id=>$(id).addEventListener('change',()=>{if(!busy)render()}));
 $('#studio-bulk').addEventListener('change',async event=>{
  if(busy)return;const files=[...event.target.files];if(!files.length)return;busy=true;const version=variant();let imported=0,unknown=[],failures=[];
  try{for(const file of files){const stem=file.name.replace(/\.[^.]+$/,'').replace(/_phone$/i,'');const clip=clips.find(c=>c.id.toLowerCase()===stem.toLowerCase());if(!clip){unknown.push(file.name);continue}message(`Import ${imported+1} : ${file.name}`);try{await save(clip,file,version);imported++}catch{failures.push(file.name)}}await loadRecordings();render();message(`${imported} fichier(s) importé(s).`+(unknown.length?' Noms non reconnus — utilisez l’import individuel : '+unknown.join(', ')+'.':'')+(failures.length?' Fichiers non importés, vérifiez le format ou le stockage : '+failures.join(', ')+'.':''),!!(unknown.length||failures.length))}catch{message('Stockage indisponible. Gardez vos fichiers originaux et réessayez.',true)}finally{busy=false;event.target.value=''}
 });
 fetch('audio-scripts/bibliotheque-v2/catalogue.json').then(response=>{if(!response.ok)throw Error('Chargement impossible');return response.json()}).then(async data=>{clips=data.clips;await loadRecordings();render()}).catch(()=>{message('Impossible de charger les scripts ou le stockage audio. Vérifiez le serveur, autorisez le stockage du site et actualisez.',true)});
})();
