(()=>{
 const container=document.querySelector('#custom-media-gallery');let urls=[],dialogURL=null,loading=false;
 const dialog=document.querySelector('#detail');
 dialog.addEventListener('close',()=>{if(dialogURL)URL.revokeObjectURL(dialogURL);dialogURL=null});
 async function refresh(){if(loading)return;loading=true;try{
  const records=(await gameMedia.all()).filter(record=>!record.trashed).sort((a,b)=>a.caseId-b.caseId||a.createdAt-b.createdAt);
  urls.forEach(url=>URL.revokeObjectURL(url));urls=[];container.replaceChildren();if(!records.length)return;
  const heading=document.createElement('h3');heading.textContent='Vos images ajoutées';container.append(heading);
  records.forEach(record=>{
   const button=document.createElement('button');button.className='elise-file';button.type='button';
   const image=document.createElement('img'),url=URL.createObjectURL(record.blob);urls.push(url);image.src=url;image.alt=record.title;image.width=120;image.height=90;image.loading='lazy';
   const caption=document.createElement('span'),label=document.createElement('span'),title=document.createElement('strong'),action=document.createElement('span');label.className='tiny';label.textContent=record.caseId?`AFFAIRE ${String(record.caseId).padStart(2,'0')}`:'IMAGE COMMUNE';title.textContent=record.title;action.textContent='Examiner l’image ↗';caption.append(label,title,action);button.append(image,caption);container.append(button);
   button.addEventListener('click',()=>{if(dialogURL)URL.revokeObjectURL(dialogURL);dialogURL=URL.createObjectURL(record.blob);const content=document.querySelector('#detail-content');content.replaceChildren();const h=document.createElement('h2'),img=document.createElement('img'),p=document.createElement('p'),link=document.createElement('a');h.textContent=record.title;img.src=dialogURL;img.alt=record.title;img.className='evidence-photo';p.textContent=record.description;link.href=dialogURL;link.target='_blank';link.rel='noopener';link.className='original-photo';link.textContent='Ouvrir l’image pour zoomer ↗';content.append(h,img,link,p);dialog.showModal()});
  });
 }catch{container.textContent='La bibliothèque locale est indisponible sur ce navigateur.'}finally{loading=false}}
 refresh();window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
