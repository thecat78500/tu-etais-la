// Premier test : une session fixe, seul le compte de David est autorisé.
const SESSION_ID = 'TEST-001';
const COMPTES_AUTORISES = ['6644853325'];
// Pour autoriser les autres comptes privés pendant vos essais : remplacer la liste par [].
return $input.all().flatMap(item => {
  const m = item.json.message;
  if (!m || m.chat?.type !== 'private' || m.from?.is_bot || typeof m.text !== 'string') return [];
  const chat = String(m.chat.id);
  if (COMPTES_AUTORISES.length && !COMPTES_AUTORISES.includes(chat)) return [];
  if (String(m.from?.id) !== chat || m.message_id === undefined) return [];
  const texte = m.text.trim().slice(0, 2000);
  if (!texte) return [];
  return [{json:{session_id:SESSION_ID,telegram_chat_id:chat,
    prenom:String(m.from.first_name || 'Invité').slice(0,80),
    texte,telegram_message_id:String(m.message_id)}}];
});
