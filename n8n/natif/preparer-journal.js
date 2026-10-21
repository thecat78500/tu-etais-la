const sortie=$('Valider la reponse de Sally').first().json;
const brut=$input.first().json;
const message=brut.result || brut;
const confirme=message.message_id !== undefined && String(message.chat?.id)===sortie.telegram_chat_id;
return [{json:{session_id:sortie.session_id,telegram_chat_id:sortie.telegram_chat_id,
  sens:'sortant',type_message:'texte',contenu:sortie.reponse,
  telegram_message_id:confirme?String(message.message_id):'',statut:confirme?'envoye':'erreur'}}];
