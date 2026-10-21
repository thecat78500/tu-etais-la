const plan=$('Planifier la partie').first().json;
const distinct=new Map();
$input.all().map(i=>i.json).filter(j=>j.session_id===plan.session_id&&j.telegram_chat_id).sort((a,b)=>Number(a.id)-Number(b.id))
  .forEach(j=>{if(!distinct.has(String(j.telegram_chat_id))) distinct.set(String(j.telegram_chat_id),j)});
const owner=String(plan.session.organisateur_chat_id);
const guests=[...distinct.keys()].filter(chat=>chat!==owner);
const accepte=distinct.has(plan.telegram_chat_id)&&(plan.telegram_chat_id===owner||guests.indexOf(plan.telegram_chat_id)>=0&&guests.indexOf(plan.telegram_chat_id)<Number(plan.session.nombre_joueurs)-1);
return [{json:{accepte,reponse:accepte?plan.reponse:'Toutes les places sont prises. Votre inscription n’a pas été conservée.'}}];
