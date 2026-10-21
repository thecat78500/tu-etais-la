const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=__dirname,workflow=JSON.parse(fs.readFileSync(path.join(root,'../sally-memoire-n8n.json'),'utf8'));
const code=name=>fs.readFileSync(path.join(root,name),'utf8');
function run(file,input,previous={}){
 const sandbox={$input:{all:()=>input.map(json=>({json})),first:()=>({json:input[0]})},
  $:name=>({first:()=>({json:previous[name]})})};
 return JSON.parse(JSON.stringify(vm.runInNewContext('(function(){'+code(file)+'})()',sandbox)));
}
const update=(chat,text,id=1,extra={})=>({message:{chat:{id:chat,type:'private'},from:{id:chat,is_bot:false,first_name:'David'},text,message_id:id,...extra}});
const prepared=run('preparer-message.js',[update(6644853325,'Bonjour Sally')])[0].json;
assert.equal(prepared.telegram_chat_id,'6644853325');assert.equal(prepared.session_id,'TEST-001');
assert.equal(run('preparer-message.js',[update(5,'Bonjour')]).length,0);
assert.equal(run('preparer-message.js',[update(6644853325,'Bonjour',1,{chat:{id:6644853325,type:'group'}})]).length,0);
assert.equal(run('preparer-message.js',[update(6644853325,' ',1)]).length,0);
assert.equal(run('preparer-message.js',[{message:{voice:{file_id:'voice'}}}]).length,0);
const old=new Date(Date.now()-120000).toISOString();
const row=(id,sens,contenu,extra={})=>({id,session_id:'TEST-001',telegram_chat_id:'6644853325',sens,
 type_message:'texte',statut:sens==='entrant'?'recu':'envoye',contenu,createdAt:old,...extra});
const previous={'Preparer le message':prepared,'Enregistrer le joueur':{role:null,camp:null},'Memoriser le message entrant':{id:50}};
const history=Array.from({length:16},(_,i)=>row(i+1,i%2?'sortant':'entrant','ancien '+i));
history.push(row(50,'entrant','Bonjour Sally'),row(60,'entrant','MESSAGE FUTUR'),
 row(20,'entrant','AUTRE JOUEUR',{telegram_chat_id:'123'}),row(21,'entrant','AUTRE PARTIE',{session_id:'AUTRE'}),
 row(22,'sortant','ENVOI NON CONFIRMÉ',{statut:'erreur'}));
const context=run('preparer-contexte.js',history,previous);
assert.equal(context.length,1,'Historique agrégé en un seul appel');assert.equal(context[0].json.request.input.length,12);
const request=JSON.stringify(context[0].json.request);
for(const secret of ['AUTRE JOUEUR','AUTRE PARTIE','MESSAGE FUTUR','ENVOI NON CONFIRMÉ','ancien 0'])assert(!request.includes(secret));
assert(!request.includes('6644853325'));assert.equal(context[0].json.request.store,false);
assert.equal(context[0].json.request.input.at(-1).content,'Bonjour Sally');
const state={'Preparer le contexte de Sally':context[0].json};
const ai={status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({reply:'Je suis là <David> & je t’entends.'})}]}]};
const reply=run('valider-reponse.js',[ai],state)[0].json;
assert.equal(reply.origine,'ia');assert(reply.telegram_html.includes('&lt;David&gt; &amp;'));
assert.equal(run('valider-reponse.js',[{error:'PROVIDER SECRET DO NOT LEAK'}],state)[0].json.reponse,context[0].json.fallback);
assert.equal(run('valider-reponse.js',[{status:'completed',output:[]}],state)[0].json.origine,'repli');
const sentState={'Valider la reponse de Sally':reply};
assert.equal(run('preparer-journal.js',[{message_id:101,chat:{id:6644853325}}],sentState)[0].json.statut,'envoye');
assert.equal(run('preparer-journal.js',[{error:'timeout'}],sentState)[0].json.statut,'erreur');
assert.equal(run('preparer-journal.js',[{message_id:101,chat:{id:4}}],sentState)[0].json.statut,'erreur');
const recent=Array.from({length:5},(_,i)=>row(i+1,'entrant','rapide',{createdAt:new Date().toISOString()}));
assert.equal(run('preparer-contexte.js',recent,previous)[0].json.needs_ai,false);
const names=new Set(workflow.nodes.map(n=>n.name));
for(const [name,outputs]of Object.entries(workflow.connections)){
 assert(names.has(name));for(const branch of outputs.main)for(const edge of branch)assert(names.has(edge.node));
}
const tables=workflow.nodes.filter(n=>n.type==='n8n-nodes-base.dataTable');assert.equal(tables.length,5);
for(const table of tables){
 if(table.parameters.filters)assert.equal(table.parameters.matchType,'allConditions');
 if(table.parameters.filters){const keys=table.parameters.filters.conditions.map(c=>c.keyName);assert(keys.includes('session_id'));assert(keys.includes('telegram_chat_id'));}
}
const player=workflow.nodes.find(n=>n.name==='Enregistrer le joueur');
assert.deepEqual(Object.keys(player.parameters.columns.value).sort(),['prenom','session_id','telegram_chat_id']);
for(const node of workflow.nodes)assert(!node.credentials,'Aucune clé ni référence locale de credential exportée');
assert.equal(workflow.active,false);
console.log('PASS: filtrage Telegram, historique borné et isolé, un appel par historique, repli IA, échappement HTML, confirmation de livraison, limite de fréquence, schéma et connexions. Aucun appel réel aux API.');
