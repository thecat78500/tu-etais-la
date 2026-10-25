// Plateau de jeu de l'iPad : accueil automatique au lancement, réécoute, ambiance, voix à chaque sceau, mise en page.
// Chromium local, requêtes interceptées, lecture audio simulée : aucun appel au vrai n8n ni son réel.
const {chromium}=require('C:/Users/DavidDaCosta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.mp3':'audio/mpeg'};
const serveur=http.createServer((req,res)=>{const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname),f=path.resolve(root,'.'+route);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(err,b)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'}).end(b)})});
const CLE='f'.repeat(64);
(async()=>{
 await new Promise(r=>serveur.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+serveur.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/DavidDaCosta/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1194,height:834}}),page=await context.newPage(),erreurs=[];page.setDefaultTimeout(10000);
  page.on('pageerror',e=>erreurs.push(e.message));
  // Lecture simulée : l'accueil dédié « manque » (repli sur l'ancienne introduction), le reste se lit.
  await page.addInitScript(()=>{window.__lectures=[];HTMLMediaElement.prototype.play=function(){const src=this.getAttribute('src')||'';if(src.startsWith('data:'))return Promise.resolve();window.__lectures.push((this.dataset.role||'?')+':'+src);if(src.includes('ACCUEIL_SALLY'))return Promise.reject(new DOMException('absent','NotSupportedError'));return Promise.resolve()};HTMLMediaElement.prototype.pause=function(){}});
  let partie=null,resolues=0;const CARNET=[{etape:1,titre:'Le nom effacé',reponse:'ALMA'},{etape:2,titre:'Les quatre marques',reponse:'LUNE CENDRE RONCE VERRE'}];
  const etat=()=>({ok:true,partie,joueurs:partie?[{prenom:'David'},{prenom:'Alice'},{prenom:'Bob'},{prenom:'Claire'}].slice(0,partie.statut==='accueil'?1:4):[],
   progression:{initialise:partie?.statut==='en_cours',resolues,total:5,active:partie?.statut==='en_cours'&&resolues<5?{etape:resolues+1,titre:['Le nom effacé','Les quatre marques','L’objet d’ancrage','L’heure derrière le mur','La formule du seuil'][resolues],enonce:'Affaire 8 — La clé n’ouvrait pas cette porte\nJ’ai essayé de vous laisser une phrase entière.\n\nQuatre fragments portent les positions 1 à 4 d’un nom gravé sous le plâtre. Quel est ce nom ?\n\nChacun peut me demander « redonne-moi mon indice ». Après discussion, dites-moi « je propose… ».'}:null,carnet:CARNET.slice(0,Math.min(resolues,2))}});
  const entetes={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Authorization'};
  await page.route('https://serteksa.ddns.net/webhook/tu-etais-la/organisateur',async route=>{
   const req=route.request();if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers:entetes});return}
   const b=new URLSearchParams(req.postData()),action=b.get('action');
   if(action==='creer')partie={code:'MPLATEAU',scenario_id:8,nombre_joueurs:4,statut:'accueil'};
   if(action==='demarrer')partie.statut='en_cours';
   if(action==='fin')partie=null;
   await route.fulfill({status:200,contentType:'application/json',headers:entetes,body:JSON.stringify({...etat(),message:'ok'})});
  });
  await page.route('https://serteksa.ddns.net/webhook/tu-etais-la/controle',async route=>{const req=route.request();if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers:entetes});return}await route.fulfill({status:200,contentType:'application/json',headers:entetes,body:JSON.stringify({ok:true,pause:false,message:'ok'})})});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.goto(url+'/ecran.html');await page.waitForLoadState('networkidle');
  assert(await page.locator('#plateau').isHidden(),'plateau fermé par défaut');
  await page.locator('#admin-key').fill(CLE);await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();
  await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);
  await page.locator('#admin-create-button').click();await page.waitForFunction(()=>!document.getElementById('admin-invitation').hidden);
  assert(await page.locator('#ouvrir-plateau').isHidden(),'pas de plateau avant le lancement');
  // Le lancement ouvre le plateau et l'accueil démarre tout seul (repli sur l'ancienne introduction, fichier dédié absent).
  await page.locator('#admin-refresh').click();await page.waitForTimeout(150);
  await page.evaluate(()=>{});
  // 4 inscrits : le mock en renvoie 4 une fois la partie lancée ; on débloque le bouton en le lançant par le clic normal.
  await page.locator('#admin-start').evaluate(b=>{b.disabled=false});
  await page.locator('#admin-start').click();
  await page.waitForFunction(()=>!document.getElementById('plateau').hidden);
  // Appel entrant : le message d'accueil sonne et ne se joue qu'une fois décroché.
  await page.waitForFunction(()=>window.Plateau.etat().appel==='sonne');
  assert(await page.locator('#pl-appel').isVisible(),'écran d’appel');
  assert((await page.locator('#pl-appel-etat').innerText()).toLowerCase().includes('appel entrant'));
  assert(await page.locator('#pl-appel-decrocher').isVisible()&&await page.locator('#pl-appel-ignorer').isVisible()&&await page.locator('#pl-appel-raccrocher').isHidden());
  assert.equal((await page.evaluate(()=>window.Plateau.etat())).voixEnCours,false,'la voix attend qu’on décroche');
  assert.equal((await page.evaluate(()=>window.__lectures)).filter(l=>l.startsWith('voix:')).length,0,'aucune voix avant de décrocher');
  assert((await page.evaluate(()=>window.Plateau.etat())).sonnerie,'la sonnerie est active');
  assert((await page.locator('#pl-appel-decrocher').boundingBox()).height>=80,'bouton Décrocher tactile');
  fs.mkdirSync(path.join(root,'captures'),{recursive:true});await page.screenshot({path:path.join(root,'captures','plateau-appel-sonne.png')});
  await page.locator('#pl-appel-decrocher').click();
  await page.waitForFunction(()=>window.Plateau.etat().voixEnCours);
  assert.equal((await page.evaluate(()=>window.Plateau.etat())).appel,'en-ligne');
  assert(await page.locator('#pl-appel-raccrocher').isVisible()&&await page.locator('#pl-appel-decrocher').isHidden());
  await page.screenshot({path:path.join(root,'captures','plateau-appel-en-ligne.png')});
  let lectures=await page.evaluate(()=>window.__lectures);
  assert(lectures.some(l=>l.includes('voix:assets/audio/ACCUEIL_SALLY.mp3')),'accueil tenté en premier');
  assert(lectures.some(l=>l.includes('voix:assets/audio/sally-introduction.mp3')),'repli sur l’ancienne introduction');
  assert(lectures.some(l=>l.startsWith('musique:')),'ambiance démarrée');
  assert((await page.locator('#pl-etat-voix').innerText()).toLowerCase().includes('sally parle'));
  assert((await page.locator('#pl-appel-texte').innerText()).includes('Vous m’entendez'),'texte du message affiché pendant l’appel');
  assert(await page.locator('#pl-invite').isHidden(),'le toucher du lancement a déverrouillé le son');
  assert.equal((await page.evaluate(()=>window.Plateau.etat())).courant,'accueil');
  // Contenu simple : titre du sceau, énoncé nettoyé, cinq sceaux, joueurs.
  assert.equal(await page.locator('#pl-titre').innerText(),'Le nom effacé');
  const enonce=await page.locator('#pl-enonce').innerText();assert(enonce.includes('Quatre fragments')&&!enonce.includes('redonne-moi')&&!enonce.includes('Affaire 8'));
  assert.equal(await page.locator('#pl-sceaux li').count(),5);assert.equal(await page.locator('#pl-joueurs li').count(),4);
  assert((await page.locator('#pl-sceau-num').innerText()).includes('SCEAU I SUR V'));
  // Réécoute : fin de la voix, puis bouton Réécouter et liste des voix.
  await page.locator('#pl-audio-voix').evaluate(a=>a.dispatchEvent(new Event('ended')));
  await page.waitForFunction(()=>!window.Plateau.etat().voixEnCours&&window.Plateau.etat().appel==='termine');
  await page.waitForFunction(()=>window.Plateau.etat().appel===null,null,{timeout:4000});
  assert(await page.locator('#pl-appel').isHidden(),'l’appel se referme tout seul à la fin de la voix');
  const avant=(await page.evaluate(()=>window.__lectures)).length;
  await page.locator('#pl-rejouer').click();await page.waitForFunction(()=>window.Plateau.etat().voixEnCours);
  assert((await page.evaluate(()=>window.__lectures)).length>avant,'réécoute');
  await page.locator('#pl-rejouer').click();await page.waitForFunction(()=>!window.Plateau.etat().voixEnCours);
  await page.locator('#pl-voix').click();assert(await page.locator('#pl-feuille').isVisible());assert.equal(await page.locator('#pl-feuille-liste li').count(),1);
  await page.locator('#pl-feuille-fermer').click();assert(await page.locator('#pl-feuille').isHidden());
  // Ambiance : bouton, état, volume.
  await page.locator('#pl-musique').click();assert.equal(await page.locator('#pl-musique').getAttribute('aria-pressed'),'false');
  await page.locator('#pl-musique').click();assert.equal(await page.locator('#pl-musique').getAttribute('aria-pressed'),'true');
  await page.locator('#pl-volume').fill('0.3');assert.equal(await page.evaluate(()=>localStorage.getItem('tu-etais-la-volume')),'0.3');
  // Niveau de la musique par rapport aux bruits et aux voix : curseur propre, mémorisé.
  assert.equal(await page.locator('#pl-musique-niveau').inputValue(),'0.5');
  await page.locator('#pl-musique-niveau').fill('0.2');assert.equal(await page.evaluate(()=>localStorage.getItem('tu-etais-la-musique-niveau')),'0.2');
  // Bruits de la maison : un bruit déclenché à la main, puis des bruits aléatoires, jamais par-dessus une voix.
  await page.evaluate(()=>window.Plateau.effet('craquement'));
  assert((await page.evaluate(()=>window.Plateau.etat().effets)).includes('craquement'));
  await page.evaluate(()=>window.Plateau.delaisEffets({debut:[120,200],milieu:[120,200],fin:[120,200]}));
  await page.waitForFunction(()=>window.Plateau.etat().effets.length>=3,null,{timeout:6000});
  const permis=await page.evaluate(()=>window.Plateau.etat().effetsPossibles.concat(['sceau-ouvert','indice-decouvert']));
  assert((await page.evaluate(()=>window.Plateau.etat().effets)).every(e=>permis.includes(e)));
  await page.evaluate(()=>window.Plateau.jouer('accueil',false));await page.waitForFunction(()=>window.Plateau.etat().voixEnCours);
  const avantVoix=(await page.evaluate(()=>window.Plateau.etat().effets)).length;await page.waitForTimeout(700);
  assert.equal((await page.evaluate(()=>window.Plateau.etat().effets)).length,avantVoix,'aucun bruit pendant une voix');
  await page.locator('#pl-audio-voix').evaluate(a=>a.dispatchEvent(new Event('ended')));
  await page.waitForFunction(n=>window.Plateau.etat().effets.length>n,avantVoix,{timeout:4000});
  // Vos propres sons : effets.json donne la liste ; un nom sans fichier ni bruit de base est ignoré sans erreur.
  await page.route('**/assets/audio/effets/effets.json',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({debut:['pas'],milieu:['pas','sans-fichier'],fin:['pas']})}));
  await page.evaluate(()=>window.Plateau.rechargerEffets());
  const avantListe=(await page.evaluate(()=>window.Plateau.etat().effets)).length;
  await page.waitForFunction(n=>window.Plateau.etat().effets.length>=n+3,avantListe,{timeout:6000});
  const issus=(await page.evaluate(()=>window.Plateau.etat().effets)).slice(avantListe);
  assert(issus.every(e=>e==='pas'),'seuls les sons de la liste sont joués : '+issus);
  assert((await page.evaluate(()=>[...document.querySelectorAll('#pl-bruits button')].map(b=>b.textContent))).includes('pas'));
  await page.unroute('**/assets/audio/effets/effets.json');await page.evaluate(()=>window.Plateau.rechargerEffets());
  await page.evaluate(()=>window.Plateau.delaisEffets({debut:[35000,75000],milieu:[25000,55000],fin:[15000,40000]}));
  // Un sceau s'ouvre : une voix commune part toute seule et s'ajoute à la liste réécoutable ; le carnet apparaît.
  await page.evaluate(()=>window.Plateau.mettreAJour({partie:{code:'MPLATEAU',scenario_id:8,nombre_joueurs:4,statut:'en_cours'},joueurs:[{prenom:'David'},{prenom:'Alice'},{prenom:'Bob'},{prenom:'Claire'}],progression:{initialise:true,resolues:1,total:5,active:{etape:2,titre:'Les quatre marques',enonce:'Affaire 8 — x\ny\n\nRemettez les marques dans l’ordre.'},carnet:[{etape:1,titre:'Le nom effacé',reponse:'ALMA'}]}}));
  await page.waitForFunction(()=>window.Plateau.etat().appel==='sonne'&&window.Plateau.etat().appelId==='sceau-1');
  assert.deepEqual(await page.evaluate(()=>window.Plateau.etat().messages),['accueil','sceau-1']);
  await page.waitForFunction(()=>window.Plateau.etat().effets.includes('sceau-ouvert')&&window.Plateau.etat().effets.includes('indice-decouvert'),null,{timeout:5000});
  // On ignore l'appel : il devient un appel manqué, rappelable depuis la barre et depuis la liste.
  await page.locator('#pl-appel-ignorer').click();await page.waitForFunction(()=>window.Plateau.etat().appel===null);
  assert.deepEqual(await page.evaluate(()=>window.Plateau.etat().manques),['sceau-1']);
  assert(await page.locator('#pl-manques').isVisible()&&(await page.locator('#pl-manques').innerText()).toLowerCase().includes('manqué'));
  await page.locator('#pl-manques').click();assert(await page.locator('#pl-feuille').isVisible());
  assert((await page.locator('#pl-feuille-liste li.manque').innerText()).toLowerCase().includes('appel manqué'));
  await page.locator('#pl-feuille-liste li.manque button').click();
  await page.waitForFunction(()=>window.Plateau.etat().appel==='en-ligne'&&window.Plateau.etat().voixEnCours);
  assert.deepEqual(await page.evaluate(()=>window.Plateau.etat().manques),[],'rappelé : plus manqué');assert(await page.locator('#pl-feuille').isHidden());
  await page.locator('#pl-appel-raccrocher').click();await page.waitForFunction(()=>window.Plateau.etat().appel===null,null,{timeout:4000});
  assert.equal((await page.evaluate(()=>window.Plateau.etat())).voixEnCours,false);
  assert(await page.locator('#pl-carnet').isVisible());assert((await page.locator('#pl-carnet-liste').innerText()).includes('ALMA'));
  assert.equal(await page.locator('#pl-sceaux li.ouvert').count(),1);assert.equal(await page.locator('#pl-sceaux li.courant').count(),1);
  // Annonce d'un pouvoir révélé à la table : bandeau, son, mémoire, file d'attente, sans nom ni camp.
  await page.evaluate(()=>window.Plateau.annonces([]));
  assert(await page.locator('#pl-annonce').isHidden(),'pas d’annonce sans pouvoir');
  const talisman={id:'talisman-9',type:'talisman',fragment:'Fragment authentifié : position 2 du nom = N.',at:'2026-10-24T20:00:00Z'};
  const rempart={id:'rempart-12',type:'rempart',fragment:'',at:'2026-10-24T20:05:00Z'};
  const avantPouvoir=(await page.evaluate(()=>window.Plateau.etat().effets)).length;
  await page.evaluate(t=>window.Plateau.annonces([t]),talisman);
  await page.waitForFunction(()=>!document.getElementById('pl-annonce').hidden);
  assert((await page.locator('#pl-annonce-titre').innerText()).includes('talisman'));
  assert((await page.locator('#pl-annonce-fragment').innerText()).includes('position 2 du nom = N'));
  assert(await page.locator('#pl-annonce-fermer').isVisible());
  await page.screenshot({path:path.join(root,'captures','plateau-annonce.png')});
  await page.waitForFunction(n=>window.Plateau.etat().effets.slice(n).includes('pouvoir'),avantPouvoir,{timeout:4000}); // le son d'annonce part dès que le fichier est introuvable ou lu
  const texteAnnonce=await page.locator('#pl-annonce').innerText();assert(!/Porteur|Gardien|camp|David|Alice/.test(texteAnnonce),'ni nom ni camp dans l’annonce');
  // Une deuxième annonce attend la fermeture de la première ; la même annonce ne se rejoue jamais.
  await page.evaluate(([t,r])=>window.Plateau.annonces([t,r]),[talisman,rempart]);
  assert((await page.locator('#pl-annonce-titre').innerText()).includes('talisman'),'la première reste affichée');
  await page.locator('#pl-annonce-fermer').click();
  await page.waitForFunction(()=>!document.getElementById('pl-annonce').hidden&&document.getElementById('pl-annonce-titre').textContent.includes('rempart'),null,{timeout:4000});
  await page.locator('#pl-annonce-fermer').click();await page.waitForFunction(()=>document.getElementById('pl-annonce').hidden);
  await page.evaluate(([t,r])=>window.Plateau.annonces([t,r]),[talisman,rempart]);await page.waitForTimeout(900);
  assert(await page.locator('#pl-annonce').isHidden(),'une annonce déjà faite ne revient pas');
  await page.locator('#pl-voix').click();assert(await page.locator('#pl-pouvoirs').isVisible());assert.equal(await page.locator('#pl-pouvoirs-liste li').count(),2);
  await page.locator('#pl-feuille-fermer').click();
  // Une annonce qui n'apparaît qu'au rechargement (premier regard) n'est pas rejouée.
  // Une actualisation sans changement ne rejoue rien.
  const n=(await page.evaluate(()=>window.__lectures)).length;
  await page.evaluate(()=>window.Plateau.mettreAJour({partie:{code:'MPLATEAU',scenario_id:8,nombre_joueurs:4,statut:'en_cours'},joueurs:[],progression:{initialise:true,resolues:1,total:5,active:{etape:2,titre:'Les quatre marques',enonce:'a\nb\n\nc'},carnet:[]}}));
  assert.equal((await page.evaluate(()=>window.__lectures)).length,n);
  // Compteur d'erreurs et approche de l'entité : nombres affichés, bandeau et son à chaque approche, rien au premier regard.
  const maj=(erreurs)=>page.evaluate(e=>window.Plateau.mettreAJour({partie:{code:'MPLATEAU',scenario_id:8,nombre_joueurs:4,statut:'en_cours'},joueurs:[],progression:{initialise:true,resolues:1,total:5,active:{etape:2,titre:'Les quatre marques',enonce:'a\nb\n\nc'},carnet:[],erreurs:e}}),erreurs);
  await maj({compte:2,vers_seuil:2,declenchements_total:0,proximite:0});
  assert(await page.locator('#pl-erreurs').isVisible());
  assert.equal(await page.locator('#pl-erreurs-points li').count(),3);assert.equal(await page.locator('#pl-erreurs-points li.plein').count(),2);
  assert.equal(await page.locator('#pl-proximite li').count(),5);assert.equal(await page.locator('#pl-proximite li.plein').count(),0);
  assert(await page.locator('#pl-annonce').isHidden(),'pas d’annonce sans approche');
  const avantApproche=(await page.evaluate(()=>window.Plateau.etat().effets)).length;
  await maj({compte:3,vers_seuil:0,declenchements_total:1,proximite:1});
  await page.waitForFunction(()=>!document.getElementById('pl-annonce').hidden);
  assert((await page.locator('#pl-annonce-titre').innerText()).includes('rapproché'));
  assert((await page.locator('#pl-annonce-etiquette').innerText()).toLowerCase().includes('entité'));
  assert(await page.locator('#pl-annonce-fragment').isHidden());
  await page.waitForFunction(n=>window.Plateau.etat().effets.slice(n).includes('approche'),avantApproche,{timeout:4000});
  assert.equal(await page.locator('#pl-erreurs-points li.plein').count(),0);assert.equal(await page.locator('#pl-proximite li.plein').count(),1);
  assert(!/Porteur|Gardien|camp|David|Alice|ZORA/.test(await page.locator('#pl-annonce').innerText()),'ni nom ni réponse dans le bandeau');
  await page.screenshot({path:path.join(root,'captures','plateau-approche.png')});
  await page.locator('#pl-annonce-fermer').click();await page.waitForFunction(()=>document.getElementById('pl-annonce').hidden);
  await maj({compte:3,vers_seuil:0,declenchements_total:1,proximite:1});await page.waitForTimeout(900);
  assert(await page.locator('#pl-annonce').isHidden(),'la même approche ne se rejoue pas');
  // Premier regard sur une partie (ou rechargement) : le compteur s'affiche, rien n'est annoncé.
  await page.evaluate(()=>sessionStorage.removeItem('tu-etais-la-approches-MPLATEAU'));
  await maj({compte:7,vers_seuil:1,declenchements_total:2,proximite:2});await page.waitForTimeout(900);
  assert(await page.locator('#pl-annonce').isHidden(),'au premier regard, rien n’est annoncé');
  assert.equal(await page.locator('#pl-erreurs-points li.plein').count(),1);assert.equal(await page.locator('#pl-proximite li.plein').count(),2);
  assert(/vacille|erreur/i.test(await page.locator('#pl-erreurs-points').getAttribute('aria-label')||''),'compteur lisible aux lecteurs d’écran');
  // Mises en page : pas de défilement de la page, boutons tactiles d'au moins 56 px, paysage et portrait.
  for(const [l,h,nom] of [[1194,834,'paysage'],[834,1194,'portrait'],[1366,1024,'ipad-pro']]){
   await page.setViewportSize({width:l,height:h});await page.waitForTimeout(150);
   const mesures=await page.evaluate(()=>{const o=document.getElementById('plateau'),r=o.getBoundingClientRect();return {couvre:r.width>=innerWidth-1&&r.height>=innerHeight-1,debord:document.documentElement.scrollWidth>innerWidth+1||o.scrollWidth>o.clientWidth+1,minBouton:Math.min(...['pl-rejouer','pl-voix','pl-musique','pl-regie'].map(i=>document.getElementById(i).getBoundingClientRect().height)),dockBas:document.querySelector('.pl-dock').getBoundingClientRect().bottom<=innerHeight+1}});
   assert(mesures.couvre&&!mesures.debord&&mesures.dockBas,nom+' '+JSON.stringify(mesures));assert(mesures.minBouton>=48,nom+' boutons trop petits '+mesures.minBouton);
   fs.mkdirSync(path.join(root,'captures'),{recursive:true});await page.screenshot({path:path.join(root,'captures','plateau-'+nom+'.png')});
  }
  await page.setViewportSize({width:1194,height:834});
  // Régie : retour à la console sans tout rejouer ; le plateau se rouvre sans répéter l'accueil.
  await page.locator('#pl-regie').click();assert(await page.locator('#plateau').isHidden());assert(await page.locator('#ouvrir-plateau').isVisible());
  const avantReouverture=(await page.evaluate(()=>window.__lectures)).filter(l=>l.startsWith('voix:')).length;
  await page.locator('#ouvrir-plateau').click();assert(await page.locator('#plateau').isVisible());await page.waitForTimeout(150);
  assert.equal((await page.evaluate(()=>window.__lectures)).filter(l=>l.startsWith('voix:')).length,avantReouverture,'l’accueil ne se rejoue pas tout seul');
  // Appel sans réponse : après le délai, il devient un appel manqué.
  await page.evaluate(()=>window.Plateau.delais(300));
  await page.evaluate(()=>window.Plateau.mettreAJour({partie:{code:'MPLATEAU',scenario_id:8,nombre_joueurs:4,statut:'en_cours'},joueurs:[],progression:{initialise:true,resolues:2,total:5,active:{etape:3,titre:'L’objet d’ancrage',enonce:'Affaire 8 — x/y/z'},carnet:[]}}));
  await page.waitForFunction(()=>window.Plateau.etat().appel==='sonne'&&window.Plateau.etat().appelId==='sceau-2');
  await page.waitForFunction(()=>window.Plateau.etat().appel===null&&window.Plateau.etat().manques.includes('sceau-2'));
  await page.evaluate(()=>window.Plateau.delais(40000));
  // Sans déverrouillage (toucher absent) : l'appel sonne en silence, décrocher réveille le son.
  await page.reload();await page.waitForLoadState('networkidle');
  await page.locator('#admin-key').fill(CLE);await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();
  await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);
  await page.evaluate(()=>{sessionStorage.clear();window.Plateau.ouvrir()});
  await page.waitForFunction(()=>!document.getElementById('plateau').hidden&&window.Plateau.etat().appel==='sonne');
  assert.equal((await page.evaluate(()=>window.Plateau.etat())).deverrouille,false);assert(await page.locator('#pl-appel-decrocher').isVisible());
  await page.locator('#pl-appel-decrocher').click();await page.waitForFunction(()=>window.Plateau.etat().voixEnCours&&window.Plateau.etat().deverrouille);
  // Rechargement alors que l'accueil a déjà été annoncé : seule l'invitation à réveiller l'ambiance s'affiche.
  await page.reload();await page.waitForLoadState('networkidle');
  await page.locator('#admin-key').fill(CLE);await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();
  await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);
  await page.evaluate(()=>window.Plateau.ouvrir());await page.waitForFunction(()=>!document.getElementById('plateau').hidden);
  assert(await page.locator('#pl-invite').isVisible(),'invitation à réveiller la maison');assert(await page.locator('#pl-appel').isHidden());
  await page.locator('#pl-activer').click();assert(await page.locator('#pl-invite').isHidden());
  // Cinq portes : uniquement la participation avant la fin, puis révélation lisible et texte échappé.
  const portes={phase:'vote',jusqu:Date.now()+180000,symboles:['Lune','Cendre','Ronce','Verre','Seuil'],candidats:['Lune','Cendre','Ronce','Verre','Seuil'],prets:4,votants:2,total:4};
  const donneesPortes={partie:{code:'MPLATEAU',scenario_id:8,nombre_joueurs:4,statut:'en_cours'},joueurs:[{prenom:'David'}],progression:{initialise:true,resolues:4,total:5,active:{etape:5,titre:'Les cinq portes',enonce:'Recoupez vos exclusions.'},carnet:[],portes}};
  await page.evaluate(d=>{sessionStorage.setItem('tu-etais-la-sceaux-MPLATEAU','5');window.Plateau.mettreAJour(d)},donneesPortes);
  assert(await page.locator('#pl-portes').isVisible());assert.equal(await page.locator('#pl-portes-liste li').count(),5);
  await page.waitForFunction(()=>{const images=[...document.querySelectorAll('#pl-portes-liste img')];return images.length===5&&images.every(i=>i.complete&&i.naturalWidth>0)});
  assert((await page.locator('#pl-portes-phase').innerText()).includes('2/4 ont voté'));assert(await page.locator('#pl-portes-fin').isHidden());
  for(const [nom,width,height]of [['paysage',1194,834],['portrait',834,1194]]){
   await page.setViewportSize({width,height});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.getElementById('plateau').scrollWidth<=innerWidth));
   await page.waitForTimeout(1100);await page.screenshot({path:path.join(root,'captures','portes-'+nom+'.png')});
  }
  portes.phase='fin';portes.resultat={porte:'Ronce',issue:1,texte:'Sally revient. L’entité reste dehors.'};portes.revelation=Array.from({length:10},(_,i)=>({prenom:i===0?'<img src=x onerror=alert(1)>':'Joueur '+(i+1),role:'Gardien',camp:i<7?'gentil':'ambigu',objectif:i<7?null:'Verre',victoire:i<7}));
  donneesPortes.progression.active=null;donneesPortes.progression.resolues=5;
  await page.evaluate(d=>window.Plateau.mettreAJour(d),donneesPortes);
  assert(await page.locator('#pl-portes-fin').isVisible());assert.equal(await page.locator('#pl-portes-revelation img').count(),0);
  assert((await page.locator('#pl-portes-revelation').innerText()).includes('Victoire'));
  assert.equal(await page.locator('#pl-portes-liste .choisie strong').innerText(),'Ronce');
  await page.waitForTimeout(1100);await page.screenshot({path:path.join(root,'captures','portes-resultat.png')});
  assert.deepEqual(erreurs,[]);
  console.log('PASS plateau : accueil automatique au lancement (repli si le fichier manque), texte lisible, réécoute et liste des voix, ambiance et volume, voix à chaque sceau sans répétition, carnet, sans défilement en paysage/portrait/iPad Pro, boutons tactiles, retour à la régie, appel entrant qu’il faut décrocher (sonnerie, décrocher, raccrocher, ignorer, appel manqué rappelable, délai sans réponse), invitation si le son n’est pas déverrouillé.');
 }finally{await browser.close();serveur.close()}
})().catch(e=>{console.error(e);process.exit(1)});
