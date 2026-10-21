'use strict';
(()=>{
 const ENDPOINT='https://serteksa.ddns.net/webhook/tu-etais-la/ecran';
 const ADMIN_ENDPOINT='https://serteksa.ddns.net/webhook/tu-etais-la/organisateur';
 const $=id=>document.getElementById(id),storageKey='tu-etais-la-ecran-v1';
 const adminStorageKey='tu-etais-la-organisateur-v1';
 let association=null,affaires=[],timer=null,controller=null,generation=0,loading=false;
 let adminKey='',adminData=null,adminBusy=false,adminCertain=false,adminTimer=null,adminController=null,adminCycle=0;
 let partieTerminee=false;
 const el=(tag,texte,classe)=>{const node=document.createElement(tag);if(texte!==undefined)node.textContent=texte;if(classe)node.className=classe;return node};
 function etat(texte,classe=''){$('connection-state').textContent=texte;$('signal').className=classe}
 function memoriser(){try{if(association)sessionStorage.setItem(storageKey,JSON.stringify(association));else sessionStorage.removeItem(storageKey)}catch{}}
 function memoriserAcces(){try{if($('admin-remember').checked&&adminKey)localStorage.setItem(adminStorageKey,JSON.stringify({version:1,cle:adminKey}));else localStorage.removeItem(adminStorageKey)}catch{$('admin-feedback').textContent='Cet appareil ne permet pas de mémoriser l’accès. La connexion reste ouverte dans cet onglet.'}}
 function arreter(){generation++;clearTimeout(timer);controller?.abort();controller=null;loading=false;$('refresh').disabled=false}
 function deconnecter(message='Écran déconnecté'){arreter();association=null;memoriser();document.body.classList.remove('is-connected');$('table').hidden=true;$('association').open=false;$('catalogue').hidden=false;$('cle').value='';$('command').value='';$('pair-command').hidden=true;etat(message)}
 async function copier(texte,retour){try{await navigator.clipboard.writeText(texte);$(retour).textContent='Commande copiée. Envoie-la au bot dans Telegram.'}catch{$(retour).textContent='Copie manuellement cette commande : '+texte}}
 function catalogue(){const root=$('affaires');root.replaceChildren();$('admin-scenario').replaceChildren(...affaires.map(a=>{const option=el('option',`${String(a.id).padStart(2,'0')} — ${a.title}`);option.value=String(a.id);return option}));for(const a of affaires){const card=el('article',undefined,'affaire'),image=el('img');image.src=a.image;image.alt=a.motif;image.loading='lazy';image.width=1448;image.height=1086;const contenu=el('div');contenu.append(el('span','AFFAIRE '+String(a.id).padStart(2,'0'),'eyebrow'),el('h3',a.title),el('p',a.motif));const bouton=el('button','Choisir cette affaire ↗');bouton.type='button';bouton.addEventListener('click',()=>{$('admin-scenario').value=String(a.id);if(adminKey){$('admin-controls').scrollIntoView({behavior:'smooth',block:'start'});$('admin-feedback').textContent='Affaire sélectionnée. Choisis le nombre de joueurs puis crée la partie.'}else{$('admin-access').open=true;$('admin-access').scrollIntoView({behavior:'smooth',block:'start'});$('admin-key').focus();$('admin-login-feedback').textContent='Affaire sélectionnée. Connecte-toi pour créer la partie depuis cet écran.'}});contenu.append(bouton);card.append(image,contenu);root.append(card)}}
 function afficher(data){
  if(!data?.ok||!data.partie||!Array.isArray(data.joueurs)||!data.progression||!Array.isArray(data.progression.carnet))throw Error('Réponse inattendue du serveur.');
  if(data.partie.code!==association.partie)throw Error('Le serveur a renvoyé une autre partie.');
  const a=affaires.find(a=>a.id===data.partie.scenario_id);if(!a)throw Error('Affaire inconnue.');
  document.body.classList.add('is-connected');$('table').hidden=false;$('association').open=false;$('catalogue').hidden=true;
  $('game-code').textContent=`PARTIE ${data.partie.code} / AFFAIRE ${String(a.id).padStart(2,'0')}`;$('game-title').textContent=a.title;
  $('scene-image').src=a.image;$('scene-image').alt=a.motif;$('game-intro').textContent=a.intro;
  $('player-count').textContent=`${data.joueurs.length} / ${data.partie.nombre_joueurs}`;$('roster').replaceChildren(...data.joueurs.map(j=>el('span',j.prenom)));
  const p=data.progression;$('seals').replaceChildren(...[1,2,3,4,5].map(n=>{const seal=el('span',String(n),n<=p.resolues?'done':p.active?.etape===n?'current':'');seal.setAttribute('aria-label',`Énigme ${n} : ${n<=p.resolues?'résolue':p.active?.etape===n?'en cours':'à venir'}`);return seal}));
  if(data.partie.statut==='accueil'){
   $('puzzle-number').textContent='AVANT QUE TOUT COMMENCE';$('puzzle-title').textContent='Nous attendons les autres.';$('puzzle-text').textContent='Les invités rejoignent la partie dans Telegram. Quand toutes les places sont occupées, l’organisateur touche « Lancer la partie » sur le site.';
  }else if(!p.initialise){$('puzzle-number').textContent='PRÉPARATION INCOMPLÈTE';$('puzzle-title').textContent='Les archives ne sont pas prêtes.';$('puzzle-text').textContent='Cette partie ne contient pas les cinq énigmes attendues. Demandez à l’organisateur de vérifier la version du workflow et la table jeu_enigmes.';
  }else if(p.active){$('puzzle-number').textContent=`SCEAU ${p.active.etape} / 5`;$('puzzle-title').textContent=p.active.titre;$('puzzle-text').textContent=p.active.enonce;
  }else{$('puzzle-number').textContent='LES CINQ SCEAUX SONT RECONSTITUÉS';$('puzzle-title').textContent='Le rituel est prêt.';$('puzzle-text').textContent='Vous avez réuni les cinq réponses. Le vote final et les victoires des camps ne sont pas encore automatisés. L’organisateur peut terminer le test avec « Arrêter la partie ».'}
  $('play-instructions').textContent=p.active?`Chacun demande /indice en privé dans Telegram. Discutez ensemble. Un joueur propose ensuite /repondre ${p.active.etape} VOTRE REPONSE. Les rôles et les camps restent sur vos téléphones.`:'Les messages privés restent sur vos téléphones. Cet écran affiche uniquement les découvertes communes.';
  $('notebook').replaceChildren(...p.carnet.map(e=>{const ligne=el('li');ligne.append(el('span',`${e.etape}. ${e.titre}`),el('strong',e.reponse));return ligne}));
  if(!p.carnet.length)$('notebook').append(el('li','Les réponses validées apparaîtront ici.'));
  $('freshness').textContent='Dernière synchronisation : '+new Date().toLocaleTimeString('fr-FR')+'. Actualisation toutes les 15 secondes lorsque cet écran est visible.';etat('Partie synchronisée','live');
 }
 async function actualiser(){
  if(adminKey)return commander('etat');
  if(!association||loading||document.hidden)return;clearTimeout(timer);const cycle=generation;loading=true;$('refresh').disabled=true;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),12000);
  try{
   const reponse=await fetch(ENDPOINT,{method:'POST',body:new URLSearchParams({partie:association.partie,cle:association.cle}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
   if(cycle!==generation)return;
   if(reponse.status===403){deconnecter('Accès refusé ou partie terminée');$('pair-feedback').textContent='Vérifie le code et l’association /ipad dans Telegram.';return}
   if(!reponse.ok)throw Error(`Serveur indisponible (${reponse.status}). Vérifie que le workflow écran est actif.`);
   const data=await reponse.json();if(cycle!==generation)return;afficher(data);$('pair-feedback').textContent='';
  }catch(error){if(cycle!==generation)return;etat('Synchronisation interrompue','error');$('pair-feedback').textContent=error.name==='AbortError'?'Le serveur ne répond pas. Réessaie dans un instant.':error.message||'Connexion impossible.';$('freshness').textContent='Connexion interrompue : les informations affichées peuvent être anciennes. Nouvelle tentative automatique.';if($('table').hidden)$('association').open=true;
  }finally{clearTimeout(timeout);if(cycle===generation){loading=false;controller=null;$('refresh').disabled=false;if(association&&!document.hidden)timer=setTimeout(actualiser,15000)}}
 }
 function connecter(partie,cle){if(!/^M[A-Z0-9]{7}$/.test(partie)||!/^[a-f0-9]{64}$/.test(cle)){$('pair-feedback').textContent='Vérifie le code de partie et la clé d’association.';return}if(adminKey)quitterAdmin();arreter();if(association?.partie!==partie)$('table').hidden=true;association={partie,cle};memoriser();$('partie').value=partie;$('cle').value=cle;etat('Connexion à la partie…');actualiser()}
 function boutonsAdmin(){
  const partie=adminData?.partie,pret=!!adminKey&&adminCertain&&!adminBusy;
  const finie=partie?.statut==='en_cours'&&adminData?.progression?.resolues===5;
  const phase=partie?(finie?'rejouer':partie.statut==='accueil'?'accueil':'jouer'):partieTerminee?'rejouer':'preparer';
  $('game-flow').hidden=$('admin-controls').hidden;
  for(const step of $('game-flow').querySelectorAll('[data-step]')){const courant=step.dataset.step===phase;step.classList.toggle('current',courant);if(courant)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current')}
  $('phase-guide').textContent={preparer:'Choisis le scénario et le nombre de joueurs, puis crée la partie.',accueil:'Les invités scannent le QR code. Lance la partie lorsque tout le monde est inscrit.',jouer:'Tout se passe ici et sur vos téléphones. Le carnet se met à jour au fil des réponses.',rejouer:partie?'Les cinq énigmes sont résolues. Termine cette partie pour en préparer une autre.':'La partie est terminée. Choisis vos prochains paramètres et crée une nouvelle partie.'}[phase];
  $('admin-controls').classList.toggle('has-party',!!partie);$('admin-controls').querySelector('h2').textContent=!partie?(partieTerminee?'Une nouvelle nuit.':'Préparer la partie.'):partie.statut==='accueil'?'Accueillir vos invités.':finie?'Le rituel est prêt.':'La partie est lancée.';
  $('admin-create-button').textContent=partieTerminee?'Créer une nouvelle partie ↗':'Créer la partie ↗';
  $('admin-stop').textContent=finie?'Terminer et rejouer':partie?.statut==='accueil'?'Annuler cet accueil':'Arrêter la partie';
  document.body.dataset.phase=phase;
  $('admin-create-button').disabled=!pret||!!partie;$('admin-count').disabled=!pret||!!partie;$('admin-scenario').disabled=!pret||!!partie;
  $('admin-start').disabled=!pret||partie?.statut!=='accueil'||adminData.joueurs.length!==partie.nombre_joueurs;
  $('admin-stop').disabled=!pret||!partie;$('refresh').disabled=adminBusy;
  $('admin-refresh').disabled=adminBusy;
  $('admin-invitation').hidden=!partie;
  const accueil=partie?.statut==='accueil'&&adminCertain;
  $('invitation-qr-card').hidden=!accueil;
  if(!accueil){$('invitation-qr').replaceChildren();delete $('invitation-qr').dataset.url;$('invitation-qr-large').replaceChildren();if($('invitation-qr-dialog').open)$('invitation-qr-dialog').close()}
  if(partie){const lien='https://t.me/tu_etais_la_maison_bot?start='+partie.code;$('admin-invite-url').value=lien;$('admin-open-invite').href=lien;
   if(accueil){$('invitation-qr-code').textContent=partie.code;try{window.InvitationQR.render($('invitation-qr'),lien);$('invitation-qr-error').textContent='';$('invitation-qr-open').disabled=false}catch{$('invitation-qr-error').textContent='QR indisponible. Utilisez le lien d’inscription ci-dessus.';$('invitation-qr-open').disabled=true}}
   $('admin-count').value=String(partie.nombre_joueurs);$('admin-scenario').value=String(partie.scenario_id);
   $('admin-start-hint').textContent=partie.statut==='en_cours'?'Partie en cours. Les rôles et indices restent privés dans Telegram.':`${adminData.joueurs.length}/${partie.nombre_joueurs} inscrits. Le lancement sera disponible lorsque toutes les places seront occupées.`;
  }
 }
 function quitterAdmin(message='Accès organisateur fermé'){
  adminCycle++;clearTimeout(adminTimer);adminController?.abort();adminController=null;adminKey='';adminData=null;adminCertain=false;adminBusy=false;
  try{localStorage.removeItem(adminStorageKey)}catch{}$('admin-remember').checked=false;
  $('admin-key').value='';$('admin-credential-value').value='';$('admin-config-value').hidden=true;$('admin-controls').hidden=true;$('admin-access').hidden=false;$('admin-access').open=true;$('association').hidden=false;document.body.classList.remove('has-admin');
  deconnecter(message);$('admin-login-feedback').textContent=message;$('disconnect').textContent='Déconnecter l’écran';boutonsAdmin();
 }
 async function commander(action,extra={}){
  if(!adminKey||adminBusy||(action==='etat'&&document.hidden))return;
  if(action!=='etat'&&!adminCertain){$('admin-feedback').textContent='Actualise la partie avant une nouvelle action.';return}
  clearTimeout(adminTimer);adminBusy=true;boutonsAdmin();const cycle=adminCycle;
  const aborter=new AbortController();adminController=aborter;const timeout=setTimeout(()=>aborter.abort(),20000);
  try{
   const response=await fetch(ADMIN_ENDPOINT,{method:'POST',headers:{Authorization:'Bearer '+adminKey},body:new URLSearchParams({action,requete_id:crypto.randomUUID(),...extra}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:aborter.signal});
   if(cycle!==adminCycle)return;
   if(response.status===401||response.status===403){quitterAdmin('Accès refusé. Saisis de nouveau ton code organisateur.');return}
   if(!response.ok)throw Error(`Le serveur a refusé la demande (${response.status}).`);
   const data=await response.json();if(cycle!==adminCycle)return;
   if(!data?.ok||!Object.hasOwn(data,'partie')||!Array.isArray(data.joueurs)||!data.progression)throw Error(data.message||'Réponse du serveur inattendue.');
   if(!data.partie&&(action==='fin'||adminData?.partie))partieTerminee=true;
   if(data.partie&&action==='creer')partieTerminee=false;
   adminData=data;adminCertain=true;memoriserAcces();$('admin-controls').hidden=false;$('admin-access').open=false;$('admin-access').hidden=true;$('association').hidden=true;$('admin-login-feedback').textContent='';$('disconnect').textContent='Se déconnecter';document.body.classList.add('has-admin');
   if(data.partie){association={partie:data.partie.code,cle:''};afficher(data)}else{association=null;document.body.classList.remove('is-connected');$('table').hidden=true;$('catalogue').hidden=false;etat('Organisateur connecté','live')}
   if(action!=='etat')$('admin-feedback').textContent=data.message||'Action effectuée.';
   $('freshness').textContent='Dernière synchronisation : '+new Date().toLocaleTimeString('fr-FR')+'. Actualisation toutes les 15 secondes.';
  }catch(error){if(cycle!==adminCycle)return;adminCertain=false;etat('Synchronisation interrompue','error');const message=action==='etat'?'La connexion au jeu est interrompue. Une nouvelle tentative est prévue ; tu peux aussi toucher Actualiser.':'La confirmation n’est pas arrivée. L’action peut avoir été effectuée : actualise l’état avant de réessayer.';$('admin-feedback').textContent=message;$('admin-login-feedback').textContent=message;$('freshness').textContent='État non confirmé. Les commandes sont suspendues jusqu’à la prochaine lecture réussie.';
  }finally{clearTimeout(timeout);if(cycle===adminCycle){adminBusy=false;adminController=null;boutonsAdmin();if(adminKey&&!document.hidden)adminTimer=setTimeout(()=>commander('etat'),15000)}}
 }
 $('admin-login').addEventListener('submit',event=>{event.preventDefault();if(!affaires.length)return;const cle=$('admin-key').value.trim().replace(/^Bearer\s+/i,'');if(!/^[A-Za-z0-9_-]{32,128}$/.test(cle)){$('admin-login-feedback').textContent='Utilise le code organisateur généré lors de la configuration.';return}adminCycle++;clearTimeout(adminTimer);adminController?.abort();adminBusy=false;arreter();association=null;memoriser();adminKey=cle;adminCertain=false;etat('Connexion organisateur…');commander('etat')});
 $('admin-generate').addEventListener('click',()=>{const cle=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');$('admin-key').value=cle;$('admin-credential-value').value='Bearer '+cle;$('admin-config-value').hidden=false;$('admin-login-feedback').textContent='Enregistre la valeur dans le credential n8n avant de te connecter.'});
 $('admin-copy-config').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('admin-credential-value').value);$('admin-login-feedback').textContent='Valeur copiée pour le credential n8n.'}catch{$('admin-credential-value').select();$('admin-login-feedback').textContent='Sélectionne et copie la valeur affichée.'}});
 $('admin-create').addEventListener('submit',e=>{e.preventDefault();if(!adminData?.partie)commander('creer',{nombre_joueurs:$('admin-count').value,scenario_id:$('admin-scenario').value})});
 $('admin-start').addEventListener('click',()=>{if(adminData?.partie)commander('demarrer',{partie:adminData.partie.code})});
 $('admin-stop').addEventListener('click',()=>{const code=adminData?.partie?.code;if(code&&confirm('Arrêter la partie '+code+' ? Son historique sera conservé.'))commander('fin',{partie:code})});
 $('admin-copy-invite').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('admin-invite-url').value);$('admin-feedback').textContent='Lien d’inscription copié. Partage-le avec tes invités.'}catch{$('admin-invite-url').select();$('admin-feedback').textContent='Sélectionne et copie le lien d’inscription.'}});
 $('admin-logout').addEventListener('click',()=>quitterAdmin());
 $('admin-refresh').addEventListener('click',()=>commander('etat'));
 $('invitation-qr-open').addEventListener('click',()=>{const partie=adminData?.partie;if(!partie||partie.statut!=='accueil'||!adminCertain)return;try{window.InvitationQR.render($('invitation-qr-large'),'https://t.me/tu_etais_la_maison_bot?start='+partie.code);$('invitation-qr-large-code').textContent=partie.code;$('invitation-qr-dialog').showModal()}catch{$('invitation-qr-error').textContent='Utilisez le lien d’inscription.'}});
 $('invitation-qr-close').addEventListener('click',()=>$('invitation-qr-dialog').close());
 $('make-key').addEventListener('click',()=>{const bytes=crypto.getRandomValues(new Uint8Array(32)),cle=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');$('cle').value=cle;$('command').value='/ipad '+cle;$('pair-command').hidden=false;$('pair-feedback').textContent='Envoie la commande au bot depuis le compte organisateur, puis ouvre le lien reçu.'});
 $('copy-command').addEventListener('click',()=>copier($('command').value,'pair-feedback'));
 $('connect-form').addEventListener('submit',e=>{e.preventDefault();connecter($('partie').value.trim().toUpperCase(),$('cle').value.trim())});
 $('refresh').addEventListener('click',actualiser);$('disconnect').addEventListener('click',()=>adminKey?quitterAdmin():deconnecter());
 document.addEventListener('visibilitychange',()=>{if(document.hidden){arreter();clearTimeout(adminTimer);etat(association||adminKey?'Synchronisation en pause':'Écran à associer')}else actualiser()});
 function lireFragment(){const fragment=new URLSearchParams(location.hash.slice(1)),partie=fragment.get('partie'),cle=fragment.get('cle');if(partie&&cle){history.replaceState(null,'',location.pathname+location.search);connecter(partie.trim().toUpperCase(),cle);return true}return false}
 window.addEventListener('hashchange',()=>{if(affaires.length)lireFragment()});
 async function initialiser(){try{const reponse=await fetch('catalogue-affaires.json',{cache:'no-cache'});if(!reponse.ok)throw Error();affaires=await reponse.json();catalogue()}catch{$('catalogue-feedback').textContent='La liste des affaires ne peut pas être chargée. Vérifie la publication des fichiers du site.';return}
  if(lireFragment())return;
  try{const enregistre=JSON.parse(localStorage.getItem(adminStorageKey)||'null');if(enregistre?.version===1&&typeof enregistre.cle==='string'&&/^[A-Za-z0-9_-]{32,128}$/.test(enregistre.cle)){$('admin-remember').checked=true;$('admin-key').value=enregistre.cle;adminKey=enregistre.cle;etat('Reprise de votre table…');commander('etat');return}}catch{}
  try{const ancien=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(ancien)connecter(ancien.partie,ancien.cle)}catch{}
 }
 initialiser();
})();
