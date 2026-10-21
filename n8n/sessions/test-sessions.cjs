const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const w=JSON.parse(fs.readFileSync(path.join(__dirname,'../sally-parties-n8n.json'),'utf8'));
const nodes=new Map(w.nodes.map(n=>[n.name,n]));
const tables={jeu_sessions:[],jeu_joueurs:[],jeu_messages:[],jeu_enigmes:[]},ids={jeu_sessions:0,jeu_joueurs:0,jeu_messages:0,jeu_enigmes:0};
let seq=0,outId=1000,aiCalls=0;const sent=[],requests=[];
const deep=value=>JSON.parse(JSON.stringify(value));
function execute(chat,text,messageId){
 const outputs={},incoming={message:{chat:{id:chat,type:'private'},from:{id:chat,is_bot:false,first_name:'Joueur '+chat},text,message_id:messageId||++seq}};
 const sandbox=(input)=>({$input:{all:()=>input.map(json=>({json})),first:()=>({json:input[0]})},
   $:name=>({first:()=>({json:outputs[name]?.[0]}),all:()=>((outputs[name]||[]).map(json=>({json})))}),$json:input[0]});
 const expression=(value,input)=>typeof value==='string'&&value.startsWith('={{')?
   vm.runInNewContext('('+value.slice(3,-2).trim()+')',sandbox(input)):value;
 let current='Reception Telegram',input=[incoming];
 for(let steps=0;current&&steps<100;steps++){
  const node=nodes.get(current),p=node.parameters;let output=[],branch=0;
  if(node.type.endsWith('.telegramTrigger'))output=input;
  else if(node.type==='n8n-nodes-base.code') output=vm.runInNewContext('(function(){'+p.jsCode+'})()',sandbox(input)).map(i=>i.json);
  else if(node.type==='n8n-nodes-base.if'){
   branch=expression(p.conditions.conditions[0].leftValue,input)?0:1;output=input;
  }else if(node.type==='n8n-nodes-base.dataTable'){
   const name=p.dataTableId.cachedResultName,store=tables[name];assert(store,'Known table');
   const inputs=node.executeOnce?input.slice(0,1):input;
   for(const rowInput of inputs){
    const rowInputs=[rowInput];const conditions=p.filters?.conditions||[];
    const matches=row=>conditions.every(c=>row[c.keyName]===expression(c.keyValue,rowInputs));
    let rows=store.filter(matches);
    if(p.operation==='get')output.push(...deep(rows));
    else if(p.operation==='rowNotExists'){if(!rows.length)output.push(rowInput)}
    else if(p.operation==='deleteRows'){
     output.push(...deep(rows));tables[name]=store.filter(row=>!matches(row));
    }else{
     const values=Object.fromEntries(Object.entries(p.columns.value).map(([key,val])=>[key,expression(val,rowInputs)]));
     if(p.operation==='insert'||!rows.length){
      const value={...values,id:++ids[name],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      store.push(value);output.push(deep(value));
     }else{assert.equal(p.operation,'upsert');for(const row of rows){Object.assign(row,values,{updatedAt:new Date().toISOString()});output.push(deep(row))}}
    }
   }
   if(!output.length&&node.alwaysOutputData)output=[{}];
  }else if(node.type==='@n8n/n8n-nodes-langchain.agent'){
   aiCalls++;const context=outputs['Preparer le contexte de Sally'][0];requests.push(deep(context.request));
   output=[{output:JSON.stringify({reply:'Je t’entends. Tu m’as dit : '+context.request.input.at(-1).content})}];
  }else if(node.type==='n8n-nodes-base.telegram'){
   const to=expression(p.chatId,input),text=expression(p.text,input);sent.push({chat:to,text});
   output=[{message_id:++outId,chat:{id:Number(to)},text}];
  }else throw Error('Unsupported simulated main node '+node.type);
  output=deep(output);outputs[current]=output;
  if(!output.length)return outputs;
  const edges=w.connections[current]?.main?.[branch]||[];
  assert(edges.length<=1,'No parallel writes in the main path');current=edges[0]?.node;input=output;
 }
 return outputs;
}
const owner=6644853325;
execute(2,'Bonjour');assert.equal(aiCalls,0);
execute(2,'/creer 4');assert.equal(tables.jeu_sessions.length,0);
execute(owner,'/creer 3');assert.equal(tables.jeu_sessions.length,0);
execute(owner,'/creer 4 1');let session=tables.jeu_sessions.at(-1),code=session.session_id;
assert.equal(session.nombre_joueurs,'4');assert.equal(session.statut,'accueil');
assert.equal(tables.jeu_joueurs.filter(j=>j.session_id===code).length,1);
execute(owner,'/demarrer');assert.equal(session.statut,'accueil');
execute(2,`/rejoindre ${code} Alice`);execute(3,`/start ${code}`);execute(4,`/rejoindre ${code} Bob`);
execute(5,`/rejoindre ${code} Eve`);assert.equal(tables.jeu_joueurs.filter(j=>j.session_id===code).length,4);
execute(2,'Question avant lancement');assert.equal(aiCalls,0);
execute(2,'/demarrer');assert.equal(session.statut,'accueil');
execute(owner,'/demarrer');assert.equal(session.statut,'en_cours');
const ecranCle='a'.repeat(64),ecranCle2='b'.repeat(64);
execute(2,'/ipad '+ecranCle);assert.equal(session.ecran_token,'');
execute(owner,'/ipad cle-invalide');assert.equal(session.ecran_token,'');
execute(owner,'/ipad '+ecranCle);assert.equal(session.ecran_token,ecranCle);assert(sent.at(-1).text.includes('ecran.html#partie='+code));
execute(owner,'/ipad '+ecranCle2);assert.equal(session.ecran_token,ecranCle2);
execute(owner,'/ipad couper');assert.equal(session.ecran_token,'');
execute(owner,'/ipad '+ecranCle);assert.equal(session.ecran_token,ecranCle);
const attribues=deep(tables.jeu_joueurs.filter(j=>j.session_id===code));
assert.equal(tables.jeu_enigmes.filter(e=>e.session_id===code).length,5);
assert.equal(new Set(attribues.map(j=>j.role)).size,4);
assert.equal(attribues.filter(j=>j.camp==='gentil').length,2);
assert.equal(attribues.filter(j=>j.camp==='mechant').length,1);
assert.equal(attribues.filter(j=>j.camp==='ambigu').length,1);
const callsAvantRole=aiCalls;
execute(2,'/role');assert(sent.at(-1).text.includes(attribues.find(j=>j.telegram_chat_id==='2').role));
assert.equal(aiCalls,callsAvantRole);
execute(5,'/role');assert(sent.at(-1).text.includes('après le lancement'));assert(!sent.at(-1).text.includes('Fiche privée'));
execute(2,'/role 3');assert(sent.at(-1).text.includes(attribues.find(j=>j.telegram_chat_id==='2').role));
execute(owner,'/demarrer');
assert.deepEqual(tables.jeu_joueurs.filter(j=>j.session_id===code).map(j=>[j.role,j.camp]),attribues.map(j=>[j.role,j.camp]));
execute(owner,'/fin CODE_INCONNU');assert.equal(session.statut,'en_cours');
execute(2,'Je possède une montre bleue');assert.equal(aiCalls,1);
assert(requests.at(-1).instructions.includes('déclaration personnelle'));
execute(3,'Je possède une bague rouge');assert.equal(aiCalls,2);
assert(!JSON.stringify(requests.at(-1)).includes('montre bleue'));
const enigmesPartie=tables.jeu_enigmes.filter(e=>e.session_id===code).sort((a,b)=>Number(a.etape)-Number(b.etape));
const enigme1=enigmesPartie[0],mesIndices=JSON.parse(enigme1.indices_json);
assert(requests.at(-1).instructions.includes(mesIndices['3']));
assert(!requests.at(-1).instructions.includes('indices_json'));
assert(!requests.at(-1).instructions.includes(enigmesPartie[3].solution));
const appelsEnigmes=aiCalls;
execute(5,'/indice');assert(!sent.at(-1).text.includes('Ton indice privé'));
execute(2,'/indice');assert(sent.at(-1).text.includes(mesIndices['2']));
execute(2,'/indice 3');assert(sent.at(-1).text.includes(mesIndices['2']));
execute(2,'/carnet');assert(sent.at(-1).text.includes('Aucune réponse'));
execute(2,'/repondre 2 LUNE CENDRE RONCE VERRE');assert.equal(enigme1.statut,'a_resoudre');
execute(2,'/repondre 1 FAUSSE REPONSE');assert.equal(enigme1.statut,'a_resoudre');
execute(2,'/repondre 1');assert.equal(enigme1.statut,'a_resoudre');
execute(2,'/enigme');assert(sent.at(-1).text.includes('Énigme 1/5'));
for(const enigme of enigmesPartie){
 execute(2,`/repondre ${enigme.etape} ${enigme.solution.toLowerCase()}`);
 assert.equal(enigme.statut,'resolue');
 execute(3,'/carnet');assert(sent.at(-1).text.includes(enigme.solution));
 // Réessayer une étape ancienne ne doit jamais valider la suivante.
 if(enigme.etape!=='5'){
  execute(2,`/repondre ${enigme.etape} ${enigme.solution}`);
  assert.equal(enigmesPartie[Number(enigme.etape)].statut,'a_resoudre');
 }
}
execute(2,'/enigme');assert(sent.at(-1).text.includes('cinq énigmes sont résolues'));
assert.equal(aiCalls,appelsEnigmes);
const testId=++seq;execute(2,'Encore moi',testId);const count=sent.length;execute(2,'Encore moi',testId);assert.equal(sent.length,count);
assert(tables.jeu_messages.some(m=>m.session_id===code&&m.sens==='sortant'&&m.statut==='envoye'));
execute(2,'/quitter');assert.equal(tables.jeu_joueurs.filter(j=>j.session_id===code).length,4);
execute(owner,'/fin');assert.equal(session.statut,'terminee');const before=aiCalls;execute(2,'Encore une question');assert.equal(aiCalls,before);
assert.equal(session.ecran_token,'');
execute(owner,'/creer 4 2');session=tables.jeu_sessions.at(-1);const newCode=session.session_id;assert.notEqual(newCode,code);
for(const chat of [2,3,4])execute(chat,`/rejoindre ${newCode} pseudo`);
execute(owner,'/demarrer');execute(2,'Bonjour nouvelle partie');
assert(!JSON.stringify(requests.at(-1)).includes('montre bleue'));
execute(owner,'/fin');execute(owner,'/creer 10 10');session=tables.jeu_sessions.at(-1);assert.equal(session.nombre_joueurs,'10');
execute(2,`/rejoindre ${session.session_id} Alice`);execute(2,'/quitter');
assert(!tables.jeu_joueurs.some(j=>j.session_id===session.session_id&&j.telegram_chat_id==='2'));
// Admission after concurrent writes: the organizer has one reserved slot.
const verify=nodes.get('Verifier la place disponible').parameters.jsCode;
const guestRows=Array.from({length:5},(_,i)=>({id:i+1,session_id:'MCAP',telegram_chat_id:String(i+2)}));
for(let index=0;index<guestRows.length;index++){
 const plan={session_id:'MCAP',telegram_chat_id:guestRows[index].telegram_chat_id,session:{organisateur_chat_id:String(owner),nombre_joueurs:'4'},reponse:'ok'};
 const result=vm.runInNewContext('(function(){'+verify+'})()',{$input:{all:()=>guestRows.map(json=>({json}))},$:()=>({first:()=>({json:plan})})});
 assert.equal(result[0].json.accepte,index<3);
}
for(const [name,outputs]of Object.entries(w.connections)){
 assert(nodes.has(name));for(const branches of Object.values(outputs))for(const branch of branches)for(const edge of branch)assert(nodes.has(edge.node));
}
assert(!w.nodes.some(n=>n.type==='n8n-nodes-base.httpRequest'));
assert(w.nodes.some(n=>n.parameters.dataTableId?.cachedResultName==='jeu_sessions'));
assert.equal(w.active,false);
const moteur=fs.readFileSync(path.join(__dirname,'enigmes.js'),'utf8');
const affaires=JSON.parse(fs.readFileSync(path.join(__dirname,'../../audio-scripts/bibliotheque-v2/scenarios.json'),'utf8'));
const variations=new Set();
for(let n=4;n<=10;n++)for(let affaire=1;affaire<=10;affaire++){
 const resultat=vm.runInNewContext('(function(){'+fs.readFileSync(path.join(__dirname,'roles.js'),'utf8')+'\n'+moteur+'\nreturn creerEnigmes({session_id:"TEST",scenario_id:"'+affaire+'"},Array.from({length:'+n+'},(_,i)=>({telegram_chat_id:String(i)})));})()',{AFFAIRES:affaires});
 assert.equal(resultat.length,5);variations.add(resultat.map(e=>e.solution).join('|'));
 for(const e of resultat){
  const fragments=Object.values(JSON.parse(e.indices_json));assert.equal(fragments.length,n);assert.equal(new Set(fragments).size,4);
  assert.equal(e.statut,'a_resoudre');assert(e.enonce.includes(affaires[affaire-1].title));
 }
 // Vérifier les solutions en reconstruisant les données des seuls fragments.
 const nom=Object.values(JSON.parse(resultat[0].indices_json));
 const lettres={};for(const f of nom){const m=f.match(/position (\d) du nom = ([A-Z])/);lettres[m[1]]=m[2]}
 assert.equal([1,2,3,4].map(i=>lettres[i]).join(''),resultat[0].solution);
 const mots=resultat[1].solution.split(' '),contraintes=Object.values(JSON.parse(resultat[1].indices_json));
 function permutations(a){return a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(r=>[v,...r])):[[]]}
 const possibles=permutations(mots).filter(a=>contraintes.every(c=>{
  let m=c.match(/première marque est (\w+)/);if(m)return a[0]===m[1];
  m=c.match(/(\w+) se trouve immédiatement avant (\w+)/);return a.indexOf(m[2])===a.indexOf(m[1])+1;
 }));assert.equal(possibles.length,1);assert.equal(possibles[0].join(' '),resultat[1].solution);
 const fragmentsObjet=Object.values(JSON.parse(resultat[2].indices_json));
 const mat=fragmentsObjet.find(f=>f.includes('est en ')).match(/est en (\w+)/)[1];
 const temp=fragmentsObjet.find(f=>f.includes('Au toucher')).match(/est (\w+)/)[1];
 const grav=fragmentsObjet.find(f=>f.includes('gravure')).match(/: (\w+)/)[1];
 const candidats=[...resultat[2].enonce.matchAll(/^(CLE|MONTRE|MIROIR|MEDAILLON) : (\w+), (\w+), (\w+)\./gm)].filter(m=>m[2]===mat&&m[3]===temp&&m[4]===grav);
 assert.equal(candidats.length,1);assert.equal(candidats[0][1],resultat[2].solution);
 const heures=Object.values(JSON.parse(resultat[3].indices_json));
 const toMinutes=f=>{const m=f.match(/(\d\d):(\d\d)/);return Number(m[1])*60+Number(m[2])};
 const ref=toMinutes(heures.find(f=>f.startsWith('Au premier coup'))),horloge=toMinutes(heures.find(f=>f.startsWith('Au même'))),faille=toMinutes(heures.find(f=>f.startsWith('À l’ouverture')));
 const m=faille-(horloge-ref);assert.equal(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),resultat[3].solution);
 assert.equal(resultat[4].solution,[resultat[0].solution,resultat[2].solution,resultat[3].solution,mots[1]].join(' '));
}
assert(variations.size>60);
const roleCode=fs.readFileSync(path.join(__dirname,'roles.js'),'utf8');
for(let nombre=4;nombre<=10;nombre++){
 for(let repetition=0;repetition<20;repetition++){
  const r=vm.runInNewContext('(function(){'+roleCode+';const participants=Array.from({length:'+nombre+'},(_,i)=>({session_id:"SIM",telegram_chat_id:"SIM-"+i}));return {rows:distribuer(participants),compte:REPARTITION['+nombre+']};})()');
  assert.equal(new Set(r.rows.map(j=>j.role)).size,nombre);
  for(const [index,camp]of ['gentil','mechant','ambigu'].entries())assert.equal(r.rows.filter(j=>j.camp===camp).length,r.compte[index]);
  assert(r.compte[2]<=r.compte[1]);
 }
}
console.log('PASS: création 4–10, accueil, liens Telegram, capacité, organisateur, journal, dialogues cloisonnés, nouvelle session, fin, retrait, admission après écritures et anti-doublon. Exécution simulée, aucune API externe.');
console.log('PASS: rôles distincts 4–10, répartition des camps exacte, ambigu <= méchant, fiche privée sans IA et aucun nouveau tirage sur une partie lancée.');
console.log('PASS: cinq énigmes résolubles sur 70 variantes (10 affaires × 7 effectifs), indices privés, ordre des étapes, erreurs sans progression, carnet partagé et validation sans IA.');
