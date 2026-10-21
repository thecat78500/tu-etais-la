const { chromium }=require('C:/Users/DavidDaCosta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/DavidDaCosta/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe'});
 try{
 const page=await browser.newPage({viewport:{width:1194,height:834},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/admin.html');await page.waitForLoadState('networkidle');
 await page.locator('#media-title').fill('Image test');await page.locator('#media-save').click();
 await page.getByText('Choisissez une image à importer.',{exact:true}).waitFor();
 await page.locator('#media-file').setInputFiles(path.join(__dirname,'assets/affaire-08-secretaire.png'));
 await page.getByText('Image prête à être enregistrée.',{exact:true}).waitFor();
 await page.locator('#media-title').fill('Clé ajoutée <test>');await page.locator('#media-case').selectOption('8');await page.locator('#media-description').fill('Une image personnelle de préparation.');await page.locator('#media-save').click();
 await page.locator('.media-card').waitFor();await page.reload();await page.locator('.media-card').waitFor();
 if(await page.locator('.media-card h3').innerText()!=='Clé ajoutée <test>')throw Error('Persistence/title encoding failed');
 await page.getByRole('button',{name:'Modifier',exact:true}).click();await page.locator('#media-title').fill('Clé du secrétaire');await page.locator('#media-case').selectOption('5');await page.locator('#media-save').click();await page.getByText('Image enregistrée sur cet appareil. Elle est disponible dans le jeu.',{exact:true}).waitFor();
 if(await page.locator('.media-card .tiny').innerText()!=='Affaire 05')throw Error('Reassignment failed');
 await page.getByRole('button',{name:'Retirer',exact:true}).click();await page.getByText('Image placée dans la corbeille. Vous pouvez la restaurer.',{exact:true}).waitFor();
 if(await page.locator('.media-card').count())throw Error('Trash failed');
 await page.locator('#media-filter').selectOption('trash');await page.getByRole('button',{name:'Restaurer',exact:true}).click();await page.getByText('Image restaurée.',{exact:true}).waitFor();await page.locator('#media-filter').selectOption('active');await page.locator('.media-card').waitFor();
 await page.setViewportSize({width:820,height:1180});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('iPad portrait overflow');
 await page.screenshot({path:path.join(__dirname,'apercu-admin-ipad.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.goto('http://127.0.0.1:8765/index.html');await page.locator('#custom-media-gallery .elise-file').waitFor({state:'attached'});
 await page.locator('.scenario-preview summary').click();await page.locator('#custom-media-gallery .elise-file').click();
 if(await page.locator('#detail-content h2').innerText()!=='Clé du secrétaire')throw Error('Game preview failed');
 await page.locator('#detail-content img').evaluate(img=>img.decode());
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS: image obligatoire, import, persistance, titre sûr, modification, classement, corbeille/restauration, aperçu dans le jeu, iPad et mobile.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
