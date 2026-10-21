// L'identité est fixée côté serveur. Elle n'est jamais acceptée depuis le navigateur.
const ORGANISATEUR='6644853325';
const requete=$input.first().json,body=requete.body||{};
const origine=String(requete.headers?.origin||'');
const origines=['https://thecat78500.github.io','http://127.0.0.1:8765','http://localhost:8765'];
const action=typeof body.action==='string'?body.action:'';
let erreur='';
if(origine&&!origines.includes(origine))erreur='Origine non autorisée.';
else if(!['etat','creer','demarrer','fin'].includes(action))erreur='Action non autorisée.';
const uuid=typeof body.requete_id==='string'?body.requete_id:'';
if(!erreur&&action!=='etat'&&!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(uuid))erreur='Identifiant de requête invalide.';
let texte='/statut';
if(action==='creer'){
 const nombre=String(body.nombre_joueurs||''),affaire=String(body.scenario_id||'');
 if(!/^(?:[4-9]|10)$/.test(nombre)||!/^(?:[1-9]|10)$/.test(affaire))erreur='Choisissez 4 à 10 joueurs et une affaire de 1 à 10.';
 texte=`/creer ${nombre} ${affaire}`;
}else if(action==='demarrer'||action==='fin'){
 const code=typeof body.partie==='string'?body.partie.trim().toUpperCase():'';
 if(!/^M[A-Z0-9]{7}$/.test(code))erreur='Code de partie invalide.';
 texte=`/${action} ${code}`;
}
return [{json:{telegram_chat_id:ORGANISATEUR,telegram_message_id:'WEB-'+uuid,prenom:'David',texte,action_web:action,erreur_web:erreur}}];
