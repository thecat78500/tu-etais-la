const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const path=require('node:path');
for(const file of ['01-reception-ia.json','02-expedition.json']){
 const workflow=JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8'));
 assert.equal(workflow.active,false);const names=new Set(workflow.nodes.map(n=>n.name));
 assert.equal(names.size,workflow.nodes.length);
 for(const [name,outputs] of Object.entries(workflow.connections)){
  assert(names.has(name));for(const branch of outputs.main)for(const edge of branch)assert(names.has(edge.node));
 }
 const selected={'Memoriser et preparer':{event_id:42},'Chaque envoi':{delivery_id:8,lease:'test',chat_id:'123'}};
 const sandbox={$json:{needs_ai:true,request:{model:'test'},text:'<Sally & toi>',kind:'text',chat_id:'123',path:'/srv/test.mp3'},
  $:name=>({first:()=>({json:selected[name]}),item:{json:selected[name]}})};
 for(const node of workflow.nodes){
  for(const key of ['jsonBody','text','chatId','fileSelector']){
   const value=node.parameters[key];if(typeof value==='string'&&value.startsWith('={{')){
    const result=vm.runInNewContext('('+value.slice(3,-2).trim()+')',sandbox);
    assert.notEqual(result,undefined,`${node.name}.${key}`);
   }
  }
 }
 if(file.startsWith('01')){
  const ai=workflow.nodes.find(n=>n.name==='Agent Sally - OpenAI');assert.equal(ai.parameters.nodeCredentialType,'openAiApi');
  assert.equal(ai.parameters.url,'https://api.openai.com/v1/responses');
 }else{
  const voice=workflow.nodes.find(n=>n.name==='Envoyer le vocal');
  assert(voice.parameters.url.includes('REMPLACER_PAR_VOTRE_JETON'));
  assert.equal(voice.parameters.bodyParameters.parameters[1].parameterType,'formBinaryData');
  assert.equal(voice.parameters.bodyParameters.parameters[1].inputDataFieldName,'data');
 }
}
console.log('PASS: JSON, connexions, expressions de contexte, credential OpenAI, binaire vocal, absence de jetons réels. Pas une exécution n8n.');
