return $input.all().flatMap(item=>{
  const m=item.json.message;
  if(!m || m.chat?.type!=='private' || m.from?.is_bot || String(m.from?.id)!==String(m.chat.id) || typeof m.text!=='string') return [];
  const texte=m.text.trim().slice(0,2000);
  if(!texte || m.message_id===undefined) return [];
  return [{json:{telegram_chat_id:String(m.chat.id),telegram_message_id:String(m.message_id),
    prenom:String(m.from.first_name||'Invité').slice(0,80),texte}}];
});
