const {chromium}=require('C:/Users/DavidDaCosta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,catalogue=JSON.parse(fs.readFileSync(path.join(root,'catalogue-affaires.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.mp3':'audio/mpeg'};
const serveur=http.createServer((req,res)=>{const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname),f=path.resolve(root,'.'+route);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(err,b)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(b)})});
(async()=>{
 await new Promise(r=>serveur.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+serveur.address().port;
 let browser;try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Users/DavidDaCosta/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1194,height:834}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);
 page.on('pageerror',e=>errors.push(e.message));let affaire=8,refuse=false,compteur=0,adminGame=null,perdreCreation=false,creationCount=0,adminRevoked=false;const actions=[];
 await page.route('https://serteksa.ddns.net/webhook/tu-etais-la/organisateur',async route=>{
  const req=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Authorization'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return}
  assert.equal(req.method(),'POST');
  if(adminRevoked||req.headers().authorization!=='Bearer '+'f'.repeat(64)){await route.fulfill({status:401,headers,body:'{}'});return}
  const b=new URLSearchParams(req.postData()),action=b.get('action');actions.push(action);assert(!req.url().includes('Bearer'));assert(b.get('requete_id'));
  let message='État relu.';
  if(action==='creer'){assert(!adminGame);creationCount++;adminGame={partie:{code:'MADMIN'+String(11+creationCount),scenario_id:Number(b.get('scenario_id')),nombre_joueurs:Number(b.get('nombre_joueurs')),statut:'accueil'},joueurs:[{prenom:'David'}],progression:{initialise:false,resolues:0,total:5,active:null,carnet:[]}};message='Partie créée.';if(perdreCreation){perdreCreation=false;await route.abort();return}}
  if(action==='demarrer'){assert.equal(b.get('partie'),adminGame.partie.code);assert.equal(adminGame.joueurs.length,4);adminGame.partie.statut='en_cours';adminGame.progression={initialise:true,resolues:0,total:5,active:{etape:1,titre:'Le nom effacé',enonce:'Rassemblez vos fragments.'},carnet:[]};message='Partie lancée.'}
  if(action==='fin'){assert.equal(b.get('partie'),adminGame.partie.code);adminGame=null;message='Partie terminée.'}
  await route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({ok:true,message,...(adminGame||{partie:null,joueurs:[],progression:{initialise:false,resolues:0,total:5,active:null,carnet:[]}})})});
 });
 // Pause des messages spontanés : endpoint simulé, jamais le vrai n8n.
 let pauseSimulee=false,pauseEchec=false;const controles=[];
 await page.route('https://serteksa.ddns.net/webhook/tu-etais-la/controle',async route=>{
  const req=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Authorization'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return}
  assert.equal(req.headers().authorization,'Bearer '+'f'.repeat(64));assert(!req.url().includes('Bearer'));
  const b=new URLSearchParams(req.postData()),action=b.get('action');controles.push(action);assert(/^M[A-Z0-9]{7}$/.test(b.get('partie')||''));
  if(pauseEchec){await route.fulfill({status:500,headers,body:'{}'});return}
  if(action==='pause')pauseSimulee=true;if(action==='reprendre')pauseSimulee=false;
  await route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({ok:true,pause:pauseSimulee,message:pauseSimulee?'Messages spontanés en pause.':'Messages spontanés repris.'})});
 });
 await page.route('https://serteksa.ddns.net/webhook/tu-etais-la/ecran',async route=>{
  const req=route.request();assert.equal(req.method(),'POST');assert(!req.url().includes('cle='));
  const body=new URLSearchParams(req.postData());assert.equal(body.get('partie'),'MTEST123');assert(/^[a-f0-9]{64}$/.test(body.get('cle')));compteur++;
  if(refuse){await route.fulfill({status:403,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ok:false})});return}
  await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ok:true,partie:{code:'MTEST123',scenario_id:affaire,statut:'en_cours',nombre_joueurs:4},joueurs:[{prenom:'David'},{prenom:'Alice'},{prenom:'Bob'},{prenom:'Claire'}],progression:{initialise:true,resolues:1,total:5,active:{etape:2,titre:'Les quatre marques',enonce:'Comparez les contraintes. Une seule suite respecte les quatre fragments.\nLes indices restent sur vos téléphones.'},carnet:[{etape:1,titre:'Le nom effacé',reponse:'ALMA'}]}})});
 });
 await page.goto(url+'/index.html');await page.waitForURL('**/ecran.html');await page.waitForLoadState('networkidle');assert.equal(await page.locator('.affaire').count(),10);
 await page.locator('#open-settings').click();await page.locator('#technical-settings').evaluate(n=>n.open=true);
 await page.locator('#association').evaluate(n=>n.open=true);
 await page.getByRole('button',{name:'Préparer l’association',exact:true}).click();assert(/^\/ipad [a-f0-9]{64}$/.test(await page.locator('#command').inputValue()));
 await page.locator('#partie').fill('MTEST123');await page.getByRole('button',{name:'Afficher la partie'}).click();await page.waitForFunction(()=>document.getElementById('connection-state').textContent==='Partie synchronisée');await page.locator('#return-table').click();
 assert.equal(await page.locator('#roster span').count(),4);assert((await page.locator('#notebook').innerText()).includes('ALMA'));assert((await page.locator('#game-title').innerText()).includes('clé'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const capture=path.join(root,'captures');fs.mkdirSync(capture,{recursive:true});await page.screenshot({path:path.join(capture,'ecran-ipad.png'),fullPage:true});
 for(let n=1;n<=10;n++){affaire=n;await page.locator('#refresh').click();await page.waitForFunction(t=>document.getElementById('game-title').textContent===t,catalogue[n-1].title);assert((await page.locator('#scene-image').getAttribute('src'))===catalogue[n-1].image)}
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:1194,height:834});await page.reload();await page.waitForFunction(()=>document.getElementById('connection-state').textContent==='Partie synchronisée');
 refuse=true;await page.locator('#refresh').click();await page.waitForFunction(()=>document.getElementById('table').hidden===true);assert(await page.locator('#cle').inputValue()==='');
 const avant=compteur;await page.waitForTimeout(250);assert.equal(compteur,avant);assert.deepEqual(errors,[]);
 // Le fragment contenant la clé doit disparaître de la barre d’adresse.
 refuse=false;await page.goto(url+'/ecran.html#partie=MTEST123&cle='+'e'.repeat(64));await page.waitForFunction(()=>document.getElementById('connection-state').textContent==='Partie synchronisée');assert(!page.url().includes('#'));
 await page.locator('#disconnect').click();assert(await page.locator('#table').isHidden());
 await page.evaluate(()=>{window.qrEncodedForTest=[];const original=window.qrcode;const wrapped=(...args)=>{const qr=original(...args),add=qr.addData;qr.addData=(text,...rest)=>{window.qrEncodedForTest.push(text);return add.call(qr,text,...rest)};return qr};Object.assign(wrapped,original);window.qrcode=wrapped});
 // Pilotage complet depuis le site, sans commande Telegram de l'organisateur.
 await page.locator('#admin-key').fill('f'.repeat(64));await page.locator('#open-settings').click();await page.locator('#technical-settings').evaluate(n=>n.open=true);await page.locator('.initial-config').evaluate(n=>n.open=true);await page.locator('#admin-generate').click();assert.equal(await page.locator('#admin-credential-value').inputValue(),'Bearer '+'f'.repeat(64));await page.locator('#return-table').click();
 await page.locator('#admin-key').fill('d'.repeat(64));await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();await page.waitForFunction(()=>document.getElementById('admin-login-feedback').textContent.includes('refusé'));
 await page.locator('#admin-key').fill('f'.repeat(64));await page.locator('#admin-remember').check();await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);
 assert(await page.evaluate(()=>!!localStorage.getItem('tu-etais-la-organisateur-v1')));await page.locator('.brand').click();assert(await page.locator('#admin-controls').isVisible());assert.equal(await page.locator('#game-flow [aria-current="step"]').getAttribute('data-step'),'preparer');
 // Revenir des écrans secondaires doit garder la clé et l'état du jeu.
 await page.locator('#open-scenarios').click();assert(await page.locator('#scenarios-view').isVisible());await page.locator('#open-settings').click();assert(await page.locator('#settings-view').isVisible());await page.locator('#back-navigation').click();await page.waitForFunction(()=>!document.getElementById('scenarios-view').hidden);await page.goBack();await page.waitForFunction(()=>!document.getElementById('main-view').hidden);assert(await page.locator('#admin-controls').isVisible());
 assert.equal(await page.locator('#admin-scenario option').count(),10);await page.locator('#admin-scenario').selectOption('10');await page.locator('#admin-count').selectOption('4');
 await page.locator('#admin-create-button').click();await page.waitForFunction(()=>!document.getElementById('admin-invitation').hidden);assert((await page.locator('#admin-invite-url').inputValue()).endsWith('start=MADMIN12'));assert(await page.locator('#admin-start').isDisabled());
 assert.equal(await page.locator('#game-flow [aria-current="step"]').getAttribute('data-step'),'accueil');
 assert(await page.locator('#invitation-qr-card').isVisible());assert.equal(await page.locator('#invitation-qr svg').count(),1);assert.equal(await page.locator('#invitation-qr').getAttribute('data-url'),'https://t.me/tu_etais_la_maison_bot?start=MADMIN12');
 await page.locator('#invitation-qr-open').click();assert(await page.locator('#invitation-qr-dialog').isVisible());assert.equal(await page.locator('#invitation-qr-large svg').count(),1);
 await page.locator('#invitation-qr-dialog').screenshot({path:path.join(capture,'qr-inscription-ipad.png')});await page.locator('#invitation-qr-close').click();
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1194,height:834});
 adminGame.joueurs.push({prenom:'Alice'},{prenom:'Bob'},{prenom:'Claire'});await page.locator('#admin-refresh').click();await page.waitForFunction(()=>!document.getElementById('admin-start').disabled);
 await page.locator('#admin-start').click();await page.waitForFunction(()=>document.getElementById('puzzle-title').textContent==='Le nom effacé');
 // Le lancement ouvre le plateau de jeu (testé dans verify-plateau.cjs) : on revient à la régie pour la suite.
 await page.waitForFunction(()=>!document.getElementById('plateau').hidden);await page.locator('#pl-appel-ignorer').click();await page.locator('#pl-regie').click();assert(await page.locator('#plateau').isHidden());
 assert(await page.locator('#admin-create-button').isDisabled());assert(await page.locator('#admin-stop').isEnabled());
 // Bouton Pause : visible seulement pendant une partie lancée, état relu, bascule et échec sans blocage.
 await page.waitForFunction(()=>!document.getElementById('admin-pause').hidden&&!document.getElementById('admin-pause').disabled);
 assert((await page.locator('#admin-pause').innerText()).includes('Mettre en pause'));assert((await page.locator('#admin-pause-hint').innerText()).includes('actifs'));
 await page.locator('#admin-pause').click();await page.waitForFunction(()=>document.getElementById('admin-pause').textContent.includes('Reprendre'));
 assert((await page.locator('#admin-pause-hint').innerText()).includes('en pause'));assert.equal(pauseSimulee,true);
 await page.locator('#admin-pause').click();await page.waitForFunction(()=>document.getElementById('admin-pause').textContent.includes('Mettre en pause'));assert.equal(pauseSimulee,false);
 pauseEchec=true;await page.locator('#admin-pause').click();await page.waitForFunction(()=>document.getElementById('admin-pause').disabled);assert((await page.locator('#admin-pause-hint').innerText()).includes('inconnu'));
 pauseEchec=false;await page.locator('#admin-refresh').click();await page.waitForFunction(()=>!document.getElementById('admin-pause').disabled);assert(controles.includes('etat')&&controles.includes('pause')&&controles.includes('reprendre'));
 assert(await page.locator('#admin-stop').isEnabled());
 assert.equal(await page.locator('#game-flow [aria-current="step"]').getAttribute('data-step'),'jouer');
 assert(await page.locator('#invitation-qr-card').isHidden());assert.equal(await page.locator('#invitation-qr svg').count(),0);
 await page.screenshot({path:path.join(capture,'ecran-organisateur-ipad.png'),fullPage:true});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1194,height:834});
 // Après la fin, la régie doit toujours permettre de rouvrir les portes et leur résultat.
 adminGame.progression={...adminGame.progression,resolues:5,active:null,portes:{phase:'fin',jusqu:0,symboles:['Lune','Cendre','Ronce','Verre','Seuil'],candidats:['Lune','Cendre','Ronce','Verre','Seuil'],prets:4,votants:2,total:4,resultat:{porte:'Ronce',issue:2,texte:'L’entité franchit le passage.'},revelation:[]}};
 await page.locator('#admin-refresh').click();await page.waitForFunction(()=>document.getElementById('ouvrir-plateau').textContent.includes('résultat'));
 assert(await page.locator('#ouvrir-plateau').isVisible());assert(await page.locator('#admin-pause').isHidden());
 assert((await page.locator('#puzzle-text').innerText()).includes('L’entité franchit le passage.'));
 await page.locator('#ouvrir-plateau').click();assert(await page.locator('#plateau').isVisible());
 assert.equal(await page.locator('#pl-portes-liste .choisie strong').innerText(),'Ronce');
 if(await page.locator('#pl-appel-ignorer').isVisible())await page.locator('#pl-appel-ignorer').click();
 await page.locator('#pl-regie').click();assert(await page.locator('#ouvrir-plateau').isVisible());
 page.once('dialog',d=>d.accept());await page.locator('#admin-stop').click();await page.waitForFunction(()=>document.getElementById('table').hidden);assert(await page.locator('#admin-create-button').isEnabled());
 assert.equal(await page.locator('#game-flow [aria-current="step"]').getAttribute('data-step'),'rejouer');assert((await page.locator('#admin-create-button').innerText()).includes('nouvelle partie'));
 // Une confirmation perdue ne doit pas provoquer une seconde création automatique.
 perdreCreation=true;await page.locator('#admin-create-button').click();await page.waitForFunction(()=>document.getElementById('admin-feedback').textContent.includes('confirmation'));assert(await page.locator('#admin-create-button').isDisabled());
 await page.locator('#admin-refresh').click();await page.waitForFunction(()=>!document.getElementById('table').hidden);assert.equal(actions.filter(a=>a==='creer').length,2);
 assert.equal(await page.locator('#invitation-qr').getAttribute('data-url'),'https://t.me/tu_etais_la_maison_bot?start=MADMIN13');
 const encoded=await page.evaluate(()=>window.qrEncodedForTest);assert(encoded.length>=2);assert(encoded.every(url=>/^https:\/\/t\.me\/tu_etais_la_maison_bot\?start=M[A-Z0-9]{7}$/.test(url)));assert(!encoded.some(url=>url.includes('Bearer')||url.includes('cle=')));
 // L'accès choisi comme mémorisé reprend la partie après rechargement, sans création.
 await page.reload();await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);assert((await page.locator('#game-code').innerText()).includes('MADMIN13'));assert.equal(actions.filter(a=>a==='creer').length,2);
 adminRevoked=true;await page.reload();await page.waitForFunction(()=>document.getElementById('admin-login-feedback').textContent.includes('refusé'));assert(await page.evaluate(()=>localStorage.getItem('tu-etais-la-organisateur-v1')===null));adminRevoked=false;
 await page.locator('#admin-key').fill('f'.repeat(64));await page.locator('#admin-remember').check();await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);
 await page.locator('#admin-logout').click();assert(await page.locator('#admin-controls').isHidden());assert.equal(await page.locator('#admin-key').inputValue(),'');assert(await page.evaluate(()=>localStorage.getItem('tu-etais-la-organisateur-v1')===null));assert.equal(await page.locator('#invitation-qr svg').count(),0);
 // Sans choix de mémorisation, recharger revient au formulaire de connexion.
 await page.locator('#admin-key').fill('f'.repeat(64));await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);assert(await page.evaluate(()=>localStorage.getItem('tu-etais-la-organisateur-v1')===null));await page.reload();await page.waitForLoadState('networkidle');assert(await page.locator('#admin-controls').isHidden());assert.deepEqual(errors,[]);
 console.log('PASS navigateur : dix affaires/images, association, synchronisation simulée, carnet, iPad 1194×834 et mobile sans débordement, reprise, refus et déconnexion. Aucun appel au vrai n8n.');
 console.log('PASS organisateur : code refusé/accepté, choix scénario/effectif, création et lien, attente des invités, lancement, arrêt, confirmation perdue sans nouvelle création, relecture et fermeture de l’accès.');
 console.log('PASS QR : lien Telegram exact encodé sans secret, affichage accueil, agrandissement iPad, mobile, retrait après lancement et fermeture.');
 console.log('PASS parcours autonome : entrée unique, navigation sans déconnexion, étapes, nouvelle partie/nouveau QR, mémorisation opt-in et reprise, révocation effacée, déconnexion explicite et absence de sauvegarde par défaut.');
 console.log('PASS clé fixe et retour : aucune clé régénérée, préparation du même Bearer, pages scénarios/réglages, bouton Retour et retour navigateur sans perte de connexion.');
 }finally{await browser?.close();await new Promise(r=>serveur.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
