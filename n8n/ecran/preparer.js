const session=$('Autoriser ecran').first().json.session;
const participants=$('Ecran participants').all().map(i=>i.json).filter(j=>j.session_id===session.session_id).sort((a,b)=>Number(a.id||0)-Number(b.id||0));
const uniques=new Map();for(const j of participants){if(!uniques.has(String(j.telegram_chat_id)))uniques.set(String(j.telegram_chat_id),j)}
const owner=uniques.get(String(session.organisateur_chat_id));
const invites=[...uniques.values()].filter(j=>String(j.telegram_chat_id)!==String(session.organisateur_chat_id)).slice(0,Number(session.nombre_joueurs)-1);
const joueurs=[...(owner?[owner]:[]),...invites].map(j=>({prenom:String(j.prenom||'Invité').slice(0,80)}));
const lignes=$input.all().map(i=>i.json).filter(e=>e.session_id===session.session_id);
let active=null,carnet=[],initialise=false;
if(session.statut==='en_cours'&&lignes.length===5&&[1,2,3,4,5].every(n=>lignes.filter(e=>e.etape===String(n)).length===1)){
  const etapes=lignes.sort((a,b)=>Number(a.etape)-Number(b.etape));
  if(etapes.every(e=>['resolue','a_resoudre'].includes(e.statut))){
    initialise=true;
    const premiere=etapes.findIndex(e=>e.statut!=='resolue');
    carnet=etapes.slice(0,premiere<0?5:premiere).map(e=>({etape:Number(e.etape),titre:String(e.titre),reponse:String(e.solution)}));
    if(premiere>=0){const e=etapes[premiere];active={etape:Number(e.etape),titre:String(e.titre),enonce:String(e.enonce)}}
  }
}
// Liste blanche explicite : ne jamais renvoyer les lignes brutes des tables.
return [{json:{ok:true,partie:{code:session.session_id,scenario_id:Number(session.scenario_id),statut:session.statut,nombre_joueurs:Number(session.nombre_joueurs)},joueurs,
  progression:{initialise,resolues:carnet.length,total:5,active,carnet},actualise_a:new Date().toISOString()}}];
