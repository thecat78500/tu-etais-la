const contexte=$('Preparer le contexte de Sally').first().json;
let reponse=contexte.fallback,origine='repli';
try {
  let sortie=$input.first().json.output;
  if(typeof sortie==='string') sortie=JSON.parse(sortie.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
  if(!sortie || typeof sortie.reply!=='string' || !sortie.reply.trim() || sortie.reply.length>900) throw Error('Réponse agent invalide');
  reponse=sortie.reply.trim();origine='ia';
} catch {}
return [{json:{session_id:contexte.session_id,telegram_chat_id:contexte.telegram_chat_id,reponse,origine,
  telegram_html:reponse.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}}];
