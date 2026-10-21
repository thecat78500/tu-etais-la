const plan=$('Planifier la partie').first().json;
let reponse=plan.reponse;
if(plan.inscrire) reponse=$('Verifier la place disponible').first().json.reponse;
return [{json:{session_id:plan.session_id,telegram_chat_id:plan.telegram_chat_id,reponse,origine:'commande',type_message:'commande',
  telegram_html:reponse.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}}];
