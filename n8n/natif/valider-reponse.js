const contexte = $('Preparer le contexte de Sally').first().json;
let reponse = contexte.fallback;
let origine = 'repli';
try {
  const response = $input.first().json;
  if (response.status !== 'completed') throw Error('Réponse IA non terminée');
  const texte = (response.output || []).filter(o=>o.type==='message')
    .flatMap(o=>o.content || []).filter(c=>c.type==='output_text').map(c=>c.text).join('');
  const value = JSON.parse(texte);
  if (typeof value.reply !== 'string' || !value.reply.trim() || value.reply.length>900) throw Error('Format inattendu');
  reponse=value.reply.trim(); origine='ia';
} catch {}
return [{json:{session_id:contexte.session_id,telegram_chat_id:contexte.telegram_chat_id,
  reponse,origine,telegram_html:reponse.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}}];
