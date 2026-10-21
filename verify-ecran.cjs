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
 page.on('pageerror',e=>errors.push(e.message));let affaire=8,refuse=false,compteur=0,adminGame=null,perdreCreation=false;const actions=[];
 await page.route('https://serteksa.ddns.net/webhook/tu-etais-la/organisateur',async route=>{
  const req=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Authorization'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return}
  assert.equal(req.method(),'POST');
  if(req.headers().authorization!=='Bearer '+'f'.repeat(64)){await route.fulfill({status:401,headers,body:'{}'});return}
  const b=new URLSearchParams(req.postData()),action=b.get('action');actions.push(action);assert(!req.url().includes('Bearer'));assert(b.get('requete_id'));
  let message='État relu.';
  if(action==='creer'){assert(!adminGame);adminGame={partie:{code:'MADMIN12',scenario_id:Number(b.get('scenario_id')),nombre_joueurs:Number(b.get('nombre_joueurs')),statut:'accueil'},joueurs:[{prenom:'David'}],progression:{initialise:false,resolues:0,total:5,active:null,carnet:[]}};message='Partie créée.';if(perdreCreation){perdreCreation=false;await route.abort();return}}
  if(action==='demarrer'){assert.equal(b.get('partie'),adminGame.partie.code);assert.equal(adminGame.joueurs.length,4);adminGame.partie.statut='en_cours';adminGame.progression={initialise:true,resolues:0,total:5,active:{etape:1,titre:'Le nom effacé',enonce:'Rassemblez vos fragments.'},carnet:[]};message='Partie lancée.'}
  if(action==='fin'){assert.equal(b.get('partie'),adminGame.partie.code);adminGame=null;message='Partie terminée.'}
  await route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify({ok:true,message,...(adminGame||{partie:null,joueurs:[],progression:{initialise:false,resolues:0,total:5,active:null,carnet:[]}})})});
 });
 await page.route('https://serteksa.ddns.net/webhook/tu-etais-la/ecran',async route=>{
  const req=route.request();assert.equal(req.method(),'POST');assert(!req.url().includes('cle='));
  const body=new URLSearchParams(req.postData());assert.equal(body.get('partie'),'MTEST123');assert(/^[a-f0-9]{64}$/.test(body.get('cle')));compteur++;
  if(refuse){await route.fulfill({status:403,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ok:false})});return}
  await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ok:true,partie:{code:'MTEST123',scenario_id:affaire,statut:'en_cours',nombre_joueurs:4},joueurs:[{prenom:'David'},{prenom:'Alice'},{prenom:'Bob'},{prenom:'Claire'}],progression:{initialise:true,resolues:1,total:5,active:{etape:2,titre:'Les quatre marques',enonce:'Comparez les contraintes. Une seule suite respecte les quatre fragments.\nLes indices restent sur vos téléphones.'},carnet:[{etape:1,titre:'Le nom effacé',reponse:'ALMA'}]}})});
 });
 await page.goto(url+'/ecran.html');await page.waitForLoadState('networkidle');assert.equal(await page.locator('.affaire').count(),10);
 await page.locator('#association').evaluate(n=>n.open=true);
 await page.getByRole('button',{name:'Préparer l’association',exact:true}).click();assert(/^\/ipad [a-f0-9]{64}$/.test(await page.locator('#command').inputValue()));
 await page.locator('#partie').fill('MTEST123');await page.getByRole('button',{name:'Afficher la partie'}).click();await page.waitForFunction(()=>document.getElementById('connection-state').textContent==='Partie synchronisée');
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
 // Pilotage complet depuis le site, sans commande Telegram de l'organisateur.
 await page.locator('.initial-config').evaluate(n=>n.open=true);await page.locator('#admin-generate').click();assert(/^Bearer [a-f0-9]{64}$/.test(await page.locator('#admin-credential-value').inputValue()));
 await page.locator('#admin-key').fill('d'.repeat(64));await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();await page.waitForFunction(()=>document.getElementById('admin-login-feedback').textContent.includes('refusé'));
 await page.locator('#admin-key').fill('f'.repeat(64));await page.getByRole('button',{name:'Se connecter comme organisateur'}).click();await page.waitForFunction(()=>!document.getElementById('admin-controls').hidden);
 assert.equal(await page.locator('#admin-scenario option').count(),10);await page.locator('#admin-scenario').selectOption('10');await page.locator('#admin-count').selectOption('4');
 await page.locator('#admin-create-button').click();await page.waitForFunction(()=>!document.getElementById('admin-invitation').hidden);assert((await page.locator('#admin-invite-url').inputValue()).endsWith('start=MADMIN12'));assert(await page.locator('#admin-start').isDisabled());
 adminGame.joueurs.push({prenom:'Alice'},{prenom:'Bob'},{prenom:'Claire'});await page.locator('#admin-refresh').click();await page.waitForFunction(()=>!document.getElementById('admin-start').disabled);
 await page.locator('#admin-start').click();await page.waitForFunction(()=>document.getElementById('puzzle-title').textContent==='Le nom effacé');assert(await page.locator('#admin-create-button').isDisabled());assert(await page.locator('#admin-stop').isEnabled());
 await page.screenshot({path:path.join(capture,'ecran-organisateur-ipad.png'),fullPage:true});await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1194,height:834});
 page.once('dialog',d=>d.accept());await page.locator('#admin-stop').click();await page.waitForFunction(()=>document.getElementById('table').hidden);assert(await page.locator('#admin-create-button').isEnabled());
 // Une confirmation perdue ne doit pas provoquer une seconde création automatique.
 perdreCreation=true;await page.locator('#admin-create-button').click();await page.waitForFunction(()=>document.getElementById('admin-feedback').textContent.includes('confirmation'));assert(await page.locator('#admin-create-button').isDisabled());
 await page.locator('#admin-refresh').click();await page.waitForFunction(()=>!document.getElementById('table').hidden);assert.equal(actions.filter(a=>a==='creer').length,2);
 await page.locator('#admin-logout').click();assert(await page.locator('#admin-controls').isHidden());assert.equal(await page.locator('#admin-key').inputValue(),'');assert.deepEqual(errors,[]);
 console.log('PASS navigateur : dix affaires/images, association, synchronisation simulée, carnet, iPad 1194×834 et mobile sans débordement, reprise, refus et déconnexion. Aucun appel au vrai n8n.');
 console.log('PASS organisateur : code refusé/accepté, choix scénario/effectif, création et lien, attente des invités, lancement, arrêt, confirmation perdue sans nouvelle création, relecture et fermeture de l’accès.');
 }finally{await browser?.close();await new Promise(r=>serveur.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
