const requete=$('Ecran Webhook').first().json;
const body=requete.body||{},origin=String(requete.headers?.origin||'');
const permis=['https://thecat78500.github.io','http://127.0.0.1:8765','http://localhost:8765'];
const code=typeof body.partie==='string'?body.partie.trim().toUpperCase():'';
const token=typeof body.cle==='string'?body.cle:'';
const lignes=$input.all().map(i=>i.json);
const session=lignes.length===1?lignes[0]:null;
const autorise=(!origin||permis.includes(origin))&&/^M[A-Z0-9]{7}$/.test(code)&&/^[a-f0-9]{64}$/.test(token)&&
  session?.session_id===code&&session.ecran_token===token&&['accueil','en_cours'].includes(session.statut);
return [{json:autorise?{autorise:true,session_id:code,session}:{autorise:false}}];
