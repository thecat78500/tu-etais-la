'use strict';
(()=>{
 const ENDPOINT='https://serteksa.ddns.net/webhook/tu-etais-la/ecran';
 const $=id=>document.getElementById(id),storageKey='tu-etais-la-ecran-v1';
 let association=null,affaires=[],timer=null,controller=null,generation=0,loading=false;
 const el=(tag,texte,classe)=>{const node=document.createElement(tag);if(texte!==undefined)node.textContent=texte;if(classe)node.className=classe;return node};
 function etat(texte,classe=''){$('connection-state').textContent=texte;$('signal').className=classe}
 function memoriser(){try{if(association)sessionStorage.setItem(storageKey,JSON.stringify(association));else sessionStorage.removeItem(storageKey)}catch{}}
 function arreter(){generation++;clearTimeout(timer);controller?.abort();controller=null;loading=false;$('refresh').disabled=false}
 function deconnecter(message='Écran déconnecté'){arreter();association=null;memoriser();document.body.classList.remove('is-connected');$('table').hidden=true;$('association').open=true;$('catalogue').hidden=false;$('cle').value='';$('command').value='';$('pair-command').hidden=true;etat(message)}
 async function copier(texte,retour){try{await navigator.clipboard.writeText(texte);$(retour).textContent='Commande copiée. Envoie-la au bot dans Telegram.'}catch{$(retour).textContent='Copie manuellement cette commande : '+texte}}
 function catalogue(){const root=$('affaires');root.replaceChildren();for(const a of affaires){const card=el('article',undefined,'affaire'),image=el('img');image.src=a.image;image.alt=a.motif;image.loading='lazy';image.width=1448;image.height=1086;const contenu=el('div');contenu.append(el('span','AFFAIRE '+String(a.id).padStart(2,'0'),'eyebrow'),el('h3',a.title),el('p',a.motif));const bouton=el('button','Préparer cette affaire ↗');bouton.type='button';bouton.addEventListener('click',()=>copier(`/creer ${$('catalogue-count').value} ${a.id}`,'catalogue-feedback'));contenu.append(bouton);card.append(image,contenu);root.append(card)}}
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
   $('puzzle-number').textContent='AVANT QUE TOUT COMMENCE';$('puzzle-title').textContent='Nous attendons les autres.';$('puzzle-text').textContent='Les invités rejoignent la partie dans Telegram. Quand toutes les places sont occupées, l’organisateur envoie /demarrer.';
  }else if(!p.initialise){$('puzzle-number').textContent='PRÉPARATION INCOMPLÈTE';$('puzzle-title').textContent='Les archives ne sont pas prêtes.';$('puzzle-text').textContent='Cette partie ne contient pas les cinq énigmes attendues. Demandez à l’organisateur de vérifier la version du workflow et la table jeu_enigmes.';
  }else if(p.active){$('puzzle-number').textContent=`SCEAU ${p.active.etape} / 5`;$('puzzle-title').textContent=p.active.titre;$('puzzle-text').textContent=p.active.enonce;
  }else{$('puzzle-number').textContent='LES CINQ SCEAUX SONT RECONSTITUÉS';$('puzzle-title').textContent='Le rituel est prêt.';$('puzzle-text').textContent='Vous avez réuni les cinq réponses. Le vote final et les victoires des camps ne sont pas encore automatisés. L’organisateur peut terminer le test avec /fin.'}
  $('play-instructions').textContent=p.active?`Chacun demande /indice en privé dans Telegram. Discutez ensemble. Un joueur propose ensuite /repondre ${p.active.etape} VOTRE REPONSE. Les rôles et les camps restent sur vos téléphones.`:'Les messages privés restent sur vos téléphones. Cet écran affiche uniquement les découvertes communes.';
  $('notebook').replaceChildren(...p.carnet.map(e=>{const ligne=el('li');ligne.append(el('span',`${e.etape}. ${e.titre}`),el('strong',e.reponse));return ligne}));
  if(!p.carnet.length)$('notebook').append(el('li','Les réponses validées apparaîtront ici.'));
  $('freshness').textContent='Dernière synchronisation : '+new Date().toLocaleTimeString('fr-FR')+'. Actualisation toutes les 15 secondes lorsque cet écran est visible.';etat('Partie synchronisée','live');
 }
 async function actualiser(){
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
 function connecter(partie,cle){if(!/^M[A-Z0-9]{7}$/.test(partie)||!/^[a-f0-9]{64}$/.test(cle)){$('pair-feedback').textContent='Vérifie le code de partie et la clé d’association.';return}arreter();if(association?.partie!==partie)$('table').hidden=true;association={partie,cle};memoriser();$('partie').value=partie;$('cle').value=cle;etat('Connexion à la partie…');actualiser()}
 $('make-key').addEventListener('click',()=>{const bytes=crypto.getRandomValues(new Uint8Array(32)),cle=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');$('cle').value=cle;$('command').value='/ipad '+cle;$('pair-command').hidden=false;$('pair-feedback').textContent='Envoie la commande au bot depuis le compte organisateur, puis ouvre le lien reçu.'});
 $('copy-command').addEventListener('click',()=>copier($('command').value,'pair-feedback'));
 $('connect-form').addEventListener('submit',e=>{e.preventDefault();connecter($('partie').value.trim().toUpperCase(),$('cle').value.trim())});
 $('refresh').addEventListener('click',actualiser);$('disconnect').addEventListener('click',()=>deconnecter());
 document.addEventListener('visibilitychange',()=>{if(document.hidden){arreter();etat(association?'Synchronisation en pause':'Écran à associer')}else actualiser()});
 function lireFragment(){const fragment=new URLSearchParams(location.hash.slice(1)),partie=fragment.get('partie'),cle=fragment.get('cle');if(partie&&cle){history.replaceState(null,'',location.pathname+location.search);connecter(partie.trim().toUpperCase(),cle);return true}return false}
 window.addEventListener('hashchange',()=>{if(affaires.length)lireFragment()});
 async function initialiser(){try{const reponse=await fetch('catalogue-affaires.json',{cache:'no-cache'});if(!reponse.ok)throw Error();affaires=await reponse.json();catalogue()}catch{$('catalogue-feedback').textContent='La liste des affaires ne peut pas être chargée. Vérifie la publication des fichiers du site.';return}
  if(lireFragment())return;
  try{const ancien=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(ancien)connecter(ancien.partie,ancien.cle)}catch{}
 }
 initialiser();
})();
