const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const web=JSON.parse(fs.readFileSync(path.join(__dirname,'../sally-organisateur-n8n.json'),'utf8'));
const telegram=JSON.parse(fs.readFileSync(path.join(__dirname,'../sally-parties-n8n.json'),'utf8'));
const tables={jeu_sessions:[],jeu_joueurs:[],jeu_messages:[],jeu_enigmes:[]},ids={jeu_sessions:0,jeu_joueurs:0,jeu_messages:0,jeu_enigmes:0};
const copy=v=>JSON.parse(JSON.stringify(v));let numero=0;
function run(w,event){
 const nodes=new Map(w.nodes.map(n=>[n.name,n])),outputs={};let current=w===web?'Organisateur Webhook':'Reception Telegram',input=[event];
 function sandbox(rows){return {$input:{all:()=>rows.map(json=>({json})),first:()=>({json:rows[0]})},$json:rows[0],$:nom=>({first:()=>({json:outputs[nom]?.[0]}),all:()=>(outputs[nom]||[]).map(json=>({json}))})}}
 function expr(v,rows){return typeof v==='string'&&v.startsWith('={{')?vm.runInNewContext('('+v.slice(3,-2).trim()+')',sandbox(rows)):v}
 for(let step=0;current&&step<100;step++){
  const n=nodes.get(current);assert(n,current);const p=n.parameters;let result=[],branch=0;
  if(n.type.endsWith('.webhook')||n.type.endsWith('.telegramTrigger'))result=input;
  else if(n.type.endsWith('.code'))result=vm.runInNewContext('(function(){'+p.jsCode+'})()',sandbox(input)).map(i=>i.json);
  else if(n.type.endsWith('.if')){branch=expr(p.conditions.conditions[0].leftValue,input)?0:1;result=input}
  else if(n.type.endsWith('.dataTable')){
   const nom=p.dataTableId.cachedResultName;
   for(const rowInput of n.executeOnce?input.slice(0,1):input){
    const rows=[rowInput],conditions=p.filters?.conditions||[],match=row=>conditions.every(c=>row[c.keyName]===expr(c.keyValue,rows)),store=tables[nom],matches=store.filter(match);
    if(p.operation==='get')result.push(...copy(matches));
    else if(p.operation==='rowNotExists'){if(!matches.length)result.push(rowInput)}
    else if(p.operation==='deleteRows'){result.push(...copy(matches));tables[nom]=store.filter(row=>!match(row))}
    else{const values=Object.fromEntries(Object.entries(p.columns.value).map(([k,v])=>[k,expr(v,rows)]));if(p.operation==='insert'||!matches.length){const r={...values,id:++ids[nom],createdAt:new Date().toISOString()};store.push(r);result.push(copy(r))}else{assert.equal(p.operation,'upsert');for(const r of matches){Object.assign(r,values);result.push(copy(r))}}}
   }
   if(!result.length&&n.alwaysOutputData)result=[{}];
  }else if(n.type.endsWith('.telegram')){result=[{message_id:++numero,chat:{id:Number(expr(p.chatId,input))}}]}
  else if(n.type.endsWith('.respondToWebhook'))return {status:p.options.responseCode,body:copy(expr(p.responseBody,input))};
  else throw Error('Nœud inattendu : '+n.type);
  outputs[current]=copy(result);if(!result.length)return outputs;
  const edges=w.connections[current]?.main?.[branch]||[];assert(edges.length<=1);current=edges[0]?.node;input=copy(result);
 }
 return outputs;
}
const request=(action,extra={},id=randomUUID())=>({body:{action,requete_id:id,...extra},headers:{origin:'https://thecat78500.github.io'}});
const send=(action,extra,id)=>run(web,request(action,extra,id));
const join=(chat,code)=>run(telegram,{message:{chat:{id:chat,type:'private'},from:{id:chat,first_name:'Invité '+chat},text:'/rejoindre '+code,message_id:++numero}});
assert.equal(send('etat').body.partie,null);assert.equal(tables.jeu_messages.length,0);
assert.equal(send('pirater').status,400);assert.equal(send('creer',{nombre_joueurs:'3',scenario_id:'1'}).status,400);
const creation=randomUUID();let r=send('creer',{nombre_joueurs:'4',scenario_id:'8',telegram_chat_id:'999'},creation);assert.equal(r.status,200);const code=r.body.partie.code;
assert.equal(r.body.partie.scenario_id,8);assert.equal(r.body.partie.nombre_joueurs,4);assert.equal(r.body.joueurs.length,1);assert.equal(tables.jeu_sessions[0].organisateur_chat_id,'6644853325');
send('creer',{nombre_joueurs:'4',scenario_id:'8'},creation);assert.equal(tables.jeu_sessions.length,1);
send('creer',{nombre_joueurs:'10',scenario_id:'10'});assert.equal(tables.jeu_sessions.length,1);
r=send('demarrer',{partie:code});assert.equal(r.body.partie.statut,'accueil');assert.equal(tables.jeu_enigmes.length,0);
for(const id of [2,3,4])join(id,code);
const lancement=randomUUID();r=send('demarrer',{partie:code},lancement);assert.equal(r.body.partie.statut,'en_cours');assert.equal(r.body.progression.active.etape,1);assert.equal(tables.jeu_enigmes.length,5);
const roles=JSON.stringify(tables.jeu_joueurs.map(j=>[j.role,j.camp]));send('demarrer',{partie:code},lancement);assert.equal(JSON.stringify(tables.jeu_joueurs.map(j=>[j.role,j.camp])),roles);
assert.equal(send('fin',{partie:'MFAUX123'}).body.partie.statut,'en_cours');
const serialized=JSON.stringify(r.body);for(const field of ['telegram_chat_id','ecran_token','indices_json','"solution"','"role"','"camp"'])assert(!serialized.includes(field),field);
assert(!web.nodes.some(n=>n.type.includes('langchain')||n.type.endsWith('.telegram')||n.type.endsWith('.telegramTrigger')));
const volume=tables.jeu_messages.length;for(let i=0;i<5;i++)send('etat');assert.equal(tables.jeu_messages.length,volume);
assert.equal(send('fin',{partie:code}).body.partie,null);assert.equal(tables.jeu_sessions[0].statut,'terminee');assert.equal(tables.jeu_enigmes.length,5);
r=send('creer',{nombre_joueurs:'10',scenario_id:'10'});const next=r.body.partie.code;assert.notEqual(next,code);
for(let id=10;id<19;id++)join(id,next);
r=send('demarrer',{partie:next});assert.equal(r.body.joueurs.length,10);assert.equal(r.body.partie.statut,'en_cours');
const webhook=web.nodes.find(n=>n.type.endsWith('.webhook'));assert.equal(webhook.parameters.authentication,'headerAuth');
const invalid=run(web,{...request('etat'),headers:{origin:'https://inconnu.example'}});assert.equal(invalid.status,400);
for(const [name,out]of Object.entries(web.connections)){assert(web.nodes.some(n=>n.name===name));for(const branches of Object.values(out))for(const b of branches)for(const e of b)assert(web.nodes.some(n=>n.name===e.node))}
console.log('PASS: commandes web 4 et 10 joueurs, 10e affaire, inscriptions Telegram communes, lancement conditionnel, arrêt, doublons séquentiels, état sans journalisation répétée, identité serveur fixe et réponse sans informations privées. Authentification Header Auth configurée, vérification HTTP réelle à faire sur n8n.');
