const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const w=JSON.parse(fs.readFileSync(path.join(__dirname,'../sally-agent-n8n.json'),'utf8'));
const agent=w.nodes.find(n=>n.type==='@n8n/n8n-nodes-langchain.agent');
const model=w.nodes.find(n=>n.type==='@n8n/n8n-nodes-langchain.lmChatOpenAi');
assert.equal(agent.typeVersion,2.2);assert.equal(model.typeVersion,1.2);
assert.equal(model.parameters.model.value,'gpt-4.1-mini');
const context={request:{instructions:'INSTRUCTIONS SALLY',input:[{role:'user',content:'Bonjour Sally'}]},session_id:'TEST-001',telegram_chat_id:'6644853325',fallback:'Repli'};
const evalExpr=expr=>vm.runInNewContext('('+expr.slice(3,-2).trim()+')',{$json:context});
assert(evalExpr(agent.parameters.text).includes('Bonjour Sally'));
assert(evalExpr(agent.parameters.options.systemMessage).includes('reply'));
const names=new Set(w.nodes.map(n=>n.name));
for(const [name,outputs] of Object.entries(w.connections)){
 assert(names.has(name));for(const branches of Object.values(outputs))for(const branch of branches)for(const edge of branch)assert(names.has(edge.node));
}
assert.equal(w.connections.ChatGPT.ai_languageModel[0][0].node,agent.name);
const tool=w.nodes.find(n=>n.type==='@n8n/n8n-nodes-langchain.toolCode');
assert.equal(w.connections[tool.name].ai_tool[0][0].node,agent.name);
const facts=JSON.parse(vm.runInNewContext('(function(){'+tool.parameters.jsCode+'})()',{}));
assert.equal(facts.faits.length,3);
assert(!JSON.stringify(facts).includes('6644853325'));
const code=w.nodes.find(n=>n.name==='Valider la reponse de Sally').parameters.jsCode;
function validate(value){return JSON.parse(JSON.stringify(vm.runInNewContext('(function(){'+code+'})()',{
 $input:{first:()=>({json:value})},$:()=>({first:()=>({json:context})})})));}
assert.equal(validate({output:'{"reply":"Je suis là."}'})[0].json.origine,'ia');
assert.equal(validate({output:{reply:'Je suis là.'}})[0].json.origine,'ia');
assert.equal(validate({output:'```json\n{"reply":"Je suis là."}\n```'})[0].json.origine,'ia');
assert.equal(validate({error:'error API'})[0].json.reponse,'Repli');
assert.equal(validate({output:'texte mal formé'})[0].json.origine,'repli');
assert.equal(validate({output:{reply:'<script>&'}})[0].json.telegram_html,'&lt;script&gt;&amp;');
const prep=w.nodes.find(n=>n.name==='Preparer le contexte de Sally').parameters.jsCode;
const data={session_id:'TEST-001',telegram_chat_id:'6644853325',texte:'Question'};
const previous={'Preparer le message':data,'Enregistrer le joueur':{},'Memoriser le message entrant':{id:1}};
const prepared=vm.runInNewContext('(function(){'+prep+'})()',{$input:{all:()=>[]},$:name=>({first:()=>({json:previous[name]})})});
assert.equal(prepared.length,1);assert.equal(prepared[0].json.request.input.length,1);
assert.equal(prepared[0].json.request.model,undefined);
assert(!w.nodes.some(n=>n.type==='n8n-nodes-base.httpRequest'));
assert(!JSON.stringify(w).includes('rédacteur technique SEO'));
console.log('PASS: agent et modèle fournis, expressions, liens IA, outil en lecture seule, historique, sortie output, repli et HTML. Aucun appel API.');
