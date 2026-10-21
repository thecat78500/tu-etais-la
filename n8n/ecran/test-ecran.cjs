const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const w=JSON.parse(fs.readFileSync(path.join(__dirname,'../sally-ecran-n8n.json'),'utf8'));
const nodes=new Map(w.nodes.map(n=>[n.name,n])),token='c'.repeat(64);
const session={session_id:'MTEST123',ecran_token:token,organisateur_chat_id:'123',scenario_id:'8',nombre_joueurs:'4',statut:'en_cours'};
function code(name,input,outputs){return vm.runInNewContext('(function(){'+nodes.get(name).parameters.jsCode+'})()',{$input:{all:()=>input.map(json=>({json}))},$:nom=>({first:()=>({json:outputs[nom]?.[0]}),all:()=>(outputs[nom]||[]).map(json=>({json}))})})[0].json}
function autoriser(body,rows=[session],origin='https://thecat78500.github.io'){return code('Autoriser ecran',rows,{'Ecran Webhook':[{body,headers:{origin}}]})}
assert(autoriser({partie:'MTEST123',cle:token}).autorise);
for(const body of [{},{partie:'MTEST123'},{partie:'MAUTRE12',cle:token},{partie:'MTEST123',cle:'d'.repeat(64)},{partie:{},cle:token}])assert.equal(autoriser(body).autorise,false);
assert.equal(autoriser({partie:'MTEST123',cle:token},[session],'https://inconnu.example').autorise,false);
assert.equal(autoriser({partie:'MTEST123',cle:token},[{...session,statut:'terminee'}]).autorise,false);
assert.equal(autoriser({partie:'MTEST123',cle:token},[{...session,ecran_token:''}]).autorise,false);
assert.equal(autoriser({partie:'MTEST123',cle:token},[session,session]).autorise,false);
const participants=[{id:1,session_id:session.session_id,telegram_chat_id:'123',prenom:'David',role:'SECRET_ROLE',camp:'SECRET_CAMP',photo_file_id:'SECRET_PHOTO'},
 {id:2,session_id:session.session_id,telegram_chat_id:'456',prenom:'Alice'},
 {id:3,session_id:'AUTRE',telegram_chat_id:'789',prenom:'INTERDIT'}];
const enigmes=Array.from({length:5},(_,i)=>({session_id:session.session_id,etape:String(i+1),titre:'Énigme '+(i+1),enonce:'PUBLIC '+i,solution:'SOLUTION_PRIVEE_'+i,indices_json:'SECRET_INDICES',statut:i===0?'resolue':'a_resoudre'}));
const outputs={'Autoriser ecran':[{session}],'Ecran participants':participants};
const publicData=code('Preparer ecran public',enigmes,outputs),texte=JSON.stringify(publicData);
assert.equal(publicData.joueurs.length,2);assert.equal(publicData.progression.active.etape,2);assert.equal(publicData.progression.carnet.length,1);
assert(texte.includes('SOLUTION_PRIVEE_0'));
for(const interdit of ['SECRET_ROLE','SECRET_CAMP','SECRET_PHOTO','SECRET_INDICES','SOLUTION_PRIVEE_1','SOLUTION_PRIVEE_2','SOLUTION_PRIVEE_3','SOLUTION_PRIVEE_4','INTERDIT',token,'telegram_chat_id'])assert(!texte.includes(interdit),interdit);
const accueil=code('Preparer ecran public',enigmes,{'Autoriser ecran':[{session:{...session,statut:'accueil'}}],'Ecran participants':participants});
assert.equal(accueil.progression.active,null);assert.equal(accueil.progression.carnet.length,0);
const incomplete=code('Preparer ecran public',enigmes.slice(0,4),outputs);assert.equal(incomplete.progression.initialise,false);
const terminee=code('Preparer ecran public',enigmes.map(e=>({...e,statut:'resolue'})),outputs);assert.equal(terminee.progression.carnet.length,5);assert.equal(terminee.progression.active,null);
for(const [name,out]of Object.entries(w.connections)){assert(nodes.has(name));for(const branches of Object.values(out))for(const b of branches)for(const e of b)assert(nodes.has(e.node))}
assert(w.nodes.filter(n=>n.type==='n8n-nodes-base.dataTable').every(n=>n.parameters.operation==='get'&&n.parameters.filters.conditions[0].keyName==='session_id'));
assert(!w.nodes.some(n=>n.type.includes('telegram')||n.type.includes('openAi')));
console.log('PASS: accès lié à la partie/clé/origine, révocation, réponses publiques sur liste blanche, état incomplet, accueil et fin des cinq énigmes. Simulation sans serveur distant.');
