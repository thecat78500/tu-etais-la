const { chromium } = require('C:/Users/DavidDaCosta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/DavidDaCosta/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe'});
 try {
 const page=await browser.newPage({viewport:{width:1280,height:960},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 await page.waitForLoadState('networkidle');
 await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.locator('#guest-count').selectOption('4');
 await page.locator('#create-session').click();
 if(!await page.locator('#start-session').isDisabled())throw Error('Early start enabled');
 for(let i=0;i<4;i++){
 await page.locator('#add-guest').click();
 await page.locator('#guest-name').fill(['Léa','Thomas','Sarah','Nicolas','Camille'][i]);
 if(i===0){await page.locator('#guest-photo').setInputFiles(path.join(__dirname,'apercu-desktop.png'));await page.locator('#guest-preview').waitFor({state:'visible'})}
 await page.locator('#guest-form button').click();
 }
 if(await page.locator('#guest-counter').innerText()!=='4 / 4')throw Error('Guest count failed');
 if(await page.locator('#guest-roster img').count()!==1)throw Error('Photo missing');
 if(!await page.locator('#add-guest').isDisabled())throw Error('Capacity exceeded');
 await page.screenshot({path:path.join(__dirname,'apercu-invites.png'),fullPage:true});
 for(const [name,width,height] of [['ipad',1024,768],['ipad-portrait',820,1180],['ipad-pro',1366,1024],['mobile',390,844]]){
 await page.setViewportSize({width,height});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Lobby overflow '+name);
 await page.screenshot({path:path.join(__dirname,'apercu-invites-'+name+'.png'),fullPage:true});
 }
 await page.locator('#start-session').click();
 if(!await page.locator('#messages').isVisible())throw Error('Start failed');
 await page.locator('[data-tab="setup"]').click();await page.locator('#end-session').click();
 if(await page.locator('#guest-roster img').count()!==0)throw Error('Photo deletion failed');
 if(await page.locator('#guest-counter').innerText()!=='0 / 4')throw Error('Reset failed');
 await page.locator('#guest-count').selectOption('10');await page.locator('#create-session').click();
 if(await page.locator('.guest-card').count()!==10)throw Error('Ten seats missing');
 for(let i=0;i<10;i++){
  await page.locator('#add-guest').click();await page.locator('#guest-name').fill(`Invité ${i+1}`);await page.locator('#guest-form button').click();
  if(i<9&&!await page.locator('#start-session').isDisabled())throw Error('Ten-player session starts early');
 }
 if(await page.locator('#guest-counter').innerText()!=='10 / 10'||await page.locator('#start-session').isDisabled())throw Error('Ten-player readiness failed');
 if(!await page.locator('#add-guest').isDisabled())throw Error('Eleventh guest allowed');
 await page.locator('#start-session').click();await page.locator('[data-tab="setup"]').click();await page.locator('#end-session').click();
 await page.setViewportSize({width:1280,height:960});
 await page.locator('[data-tab="archives"]').click();
 await page.screenshot({path:path.join(__dirname,'apercu-desktop.png'),fullPage:true});
 await page.locator('[data-piece="photo"]').click();
 await page.locator('#detail .close').click();
 await page.locator('#code-button').click();
 await page.locator('#access-code').fill('0000');await page.locator('#code-form button').click();
 if(!(await page.locator('#code-result').innerText()).includes('aucune'))throw Error('Invalid code handling');
 await page.locator('#access-code').fill('2341');await page.locator('#code-form button').click();
 if(!(await page.locator('#detail-content').innerText()).includes('Douze secondes'))throw Error('Unlock failed');
 await page.locator('#detail .close').click();await page.reload();await page.locator('[data-tab="archives"]').click();
 if(await page.locator('#open-count').innerText()!=='2')throw Error('Persistence failed');
 await page.locator('[data-tab="timeline"]').click();
 if(await page.locator('.timeline-entry').count()!==2)throw Error('Timeline failed');
 await page.locator('[data-tab="messages"]').click();
 if(!await page.locator('.message').isVisible())throw Error('Messages failed');
 await page.locator('[data-tab="archives"]').click();
 await page.locator('[data-filter="locked"]').click();
 if(await page.locator('.evidence').count()!==5)throw Error('Filter failed');
 await page.locator('[data-filter="all"]').click();
 for(const [name,width,height] of [['ipad',1024,768],['ipad-portrait',820,1180],['ipad-pro',1366,1024],['mobile',390,844]]){
 await page.setViewportSize({width,height});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+name);
 await page.screenshot({path:path.join(__dirname,'apercu-'+name+'.png'),fullPage:true});
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: inscriptions 4 et 10 joueurs, photo, capacité, lancement, effacement, iPad/mobile ; preuves, codes, persistance et navigation.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});



