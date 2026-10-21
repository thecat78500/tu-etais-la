const ORGANISATEURS=['6644853325']; // seuls ces comptes peuvent créer une partie
const source=$('Normaliser Telegram').first().json;
const sessions=$('Lire les parties').all().map(i=>i.json).filter(s=>s.session_id);
const joueurs=$('Lire les participants').all().map(i=>i.json).filter(j=>j.session_id&&j.telegram_chat_id);
const toutesEnigmes=$input.all().map(i=>i.json).filter(e=>e.session_id&&e.etape);
const compare=(a,b)=>Number(a.id||0)-Number(b.id||0);
function membres(s){
  const distinct=new Map();
  joueurs.filter(j=>j.session_id===s.session_id).sort(compare).forEach(j=>{if(!distinct.has(String(j.telegram_chat_id)))distinct.set(String(j.telegram_chat_id),j)});
  const owner=distinct.get(String(s.organisateur_chat_id));
  const guests=[...distinct.values()].filter(j=>String(j.telegram_chat_id)!==String(s.organisateur_chat_id)).slice(0,Number(s.nombre_joueurs)-1);
  return [...(owner?[owner]:[]),...guests];
}
const actives=sessions.filter(s=>['accueil','en_cours'].includes(s.statut));
const mesParties=actives.filter(s=>membres(s).some(j=>String(j.telegram_chat_id)===source.telegram_chat_id)||String(s.organisateur_chat_id)===source.telegram_chat_id)
  .sort((a,b)=>Number(b.id||0)-Number(a.id||0));
const actuelle=mesParties[0];
const parts=source.texte.split(/\s+/),commande=parts[0].split('@')[0].toLowerCase();
const aide='Organisateur : /creer 4 1 (4 à 10 joueurs, affaire 1 à 10), /demarrer, /fin. Invités : /rejoindre CODE Pseudo. Partie : /statut, /role, /enigme, /indice, /carnet, /repondre NUMERO REPONSE. /quitter pendant l’accueil. Écrivez à Sally après le lancement.';
let plan={...source,action:'notification',session_id:actuelle?.session_id||'ACCUEIL',reponse:'',inscrire:false};
const cibleExplicite=parts[1]?actives.find(s=>s.session_id===parts[1].toUpperCase()):null;
if(commande==='/creer'){
  if(!ORGANISATEURS.includes(source.telegram_chat_id)) plan.reponse='La création d’une partie est réservée à l’organisateur.';
  else if(actuelle) plan.reponse=`Vous avez déjà une partie non terminée : ${actuelle.session_id}. Utilisez /statut ou terminez-la avant d’en créer une autre.`;
  else {
    const count=Number(parts[1]),scenario=Number(parts[2]||1);
    if(!Number.isInteger(count)||count<4||count>10||!Number.isInteger(scenario)||scenario<1||scenario>10) plan.reponse='Utilisation : /creer 4 1 — entre 4 et 10 joueurs, affaire entre 1 et 10.';
    else {
      let code;do{code='M'+Math.random().toString(36).slice(2,9).toUpperCase().padEnd(7,'X')}while(sessions.some(s=>s.session_id===code));
      const session={session_id:code,organisateur_chat_id:source.telegram_chat_id,nombre_joueurs:String(count),scenario_id:String(scenario),statut:'accueil',ecran_token:''};
      plan={...plan,action:'session',session_id:code,session,inscrire:true,
        reponse:`Partie ${code} créée pour ${count} joueurs, vous compris. Affaire ${scenario}. Invitez les autres : https://t.me/tu_etais_la_maison_bot?start=${code} ou /rejoindre ${code} Pseudo. Puis /demarrer lorsque tout le monde est inscrit.`};
    }
  }
} else if(commande==='/rejoindre'||(commande==='/start'&&parts[1])){
  const code=(parts[1]||'').toUpperCase(),target=sessions.find(s=>s.session_id===code);
  if(actuelle&&actuelle.session_id!==code) plan.reponse=`Vous êtes déjà inscrit à ${actuelle.session_id}. Quittez son accueil ou attendez sa fin avant de rejoindre une autre partie.`;
  else if(!target||target.statut!=='accueil') plan.reponse='Code inconnu ou inscriptions fermées.';
  else if(membres(target).some(j=>String(j.telegram_chat_id)===source.telegram_chat_id)) plan.reponse=`Vous êtes déjà inscrit à ${code}.`;
  else if(membres(target).length>=Number(target.nombre_joueurs)) plan.reponse='Toutes les places sont prises.';
  else plan={...plan,action:'inscription',inscrire:true,session_id:code,session:target,
    prenom:parts.slice(2).join(' ').slice(0,80)||source.prenom,reponse:`Inscription confirmée à ${code}. Attendez le lancement par l’organisateur.`};
} else if(commande==='/demarrer'||commande==='/fin'){
  const target=cibleExplicite||actuelle;
  if(parts[1]&&!cibleExplicite) plan.reponse='Code inconnu ou partie déjà terminée.';
  else if(!target||String(target.organisateur_chat_id)!==source.telegram_chat_id) plan.reponse='Vous ne dirigez pas cette partie.';
  else if(commande==='/demarrer'){
    if(target.statut!=='accueil') plan.reponse='Les échanges de cette partie sont déjà ouverts.';
    else if(membres(target).length!==Number(target.nombre_joueurs)) plan.reponse=`${membres(target).length}/${target.nombre_joueurs} inscrits. Attendez que toutes les places soient occupées.`;
    else {
      const [bons,mauvais,ambigus]=REPARTITION[Number(target.nombre_joueurs)];
      plan={...plan,action:'session',session_id:target.session_id,session:{...target,statut:'en_cours'},distribution:distribuer(membres(target)),enigmes_a_ecrire:creerEnigmes(target,membres(target)),
        reponse:`Partie ${target.session_id} lancée pour ${target.nombre_joueurs} joueurs. Rôles attribués : ${bons} gentils, ${mauvais} méchant(s), ${ambigus} ambigu(s). Chaque joueur : /role en privé, puis /enigme et /indice. Discutez ensemble avant /repondre 1 VOTRE REPONSE. Cinq énigmes vous attendent ; /carnet conserve les réponses validées.`};
    }
  } else plan={...plan,action:'session',session_id:target.session_id,session:{...target,statut:'terminee',ecran_token:''},
    reponse:`Partie ${target.session_id} terminée. Son historique est conservé et sera séparé de la prochaine partie.`};
} else if(commande==='/quitter'){
  const target=cibleExplicite||actuelle;
  if(parts[1]&&!cibleExplicite) plan.reponse='Code inconnu ou partie déjà terminée.';
  else if(!target||!membres(target).some(j=>String(j.telegram_chat_id)===source.telegram_chat_id)) plan.reponse='Vous n’êtes pas inscrit à cette partie.';
  else if(target.statut!=='accueil') plan.reponse='Une partie lancée doit être terminée par son organisateur.';
  else if(String(target.organisateur_chat_id)===source.telegram_chat_id) plan={...plan,action:'session',session_id:target.session_id,session:{...target,statut:'terminee',ecran_token:''},reponse:'Accueil fermé. Les inscriptions sont conservées dans l’historique.'};
  else plan={...plan,action:'retrait',session_id:target.session_id,reponse:`Vous avez quitté l’accueil de ${target.session_id}.`};
} else if(commande==='/ipad'){
  const token=parts[1]||'';
  if(!actuelle||String(actuelle.organisateur_chat_id)!==source.telegram_chat_id)plan.reponse='Seul l’organisateur d’une partie active peut associer l’iPad.';
  else if(token==='couper')plan={...plan,action:'session',session:{...actuelle,ecran_token:''},reponse:'Accès de l’écran partagé révoqué. Les échanges Telegram continuent.'};
  else if(!/^[a-f0-9]{64}$/.test(token))plan.reponse='Ouvre https://thecat78500.github.io/tu-etais-la/ecran.html sur l’iPad, puis copie ici la commande d’association proposée. /ipad couper révoque cet accès.';
  else plan={...plan,action:'session',session:{...actuelle,ecran_token:token},
    reponse:`Écran associé à ${actuelle.session_id}. Ouvre ce lien sur l’iPad : https://thecat78500.github.io/tu-etais-la/ecran.html#partie=${actuelle.session_id}&cle=${token} . Ce lien donne accès à l’écran collectif ; garde-le pour votre table. /ipad couper révoque cet accès.`};
} else if(['/enigme','/indice','/carnet','/repondre'].includes(commande)){
  if(!actuelle||actuelle.statut!=='en_cours')plan.reponse='Rejoignez une partie et attendez son lancement avant de consulter les énigmes.';
  else {
    const participant=membres(actuelle).find(j=>String(j.telegram_chat_id)===source.telegram_chat_id);
    if(!participant)plan.reponse='Votre inscription n’est pas confirmée.';
    else plan={...plan,...gererEnigmes(commande,parts.slice(1),actuelle,participant,toutesEnigmes)};
  }
} else if(commande==='/role'){
  if(!actuelle||actuelle.statut!=='en_cours')plan.reponse='Ta fiche sera disponible après le lancement de ta partie.';
  else plan.reponse=fiche(membres(actuelle).find(j=>String(j.telegram_chat_id)===source.telegram_chat_id));
} else if(commande==='/statut'){
  if(!actuelle) plan.reponse='Vous n’êtes inscrit à aucune partie. '+aide;
  else {
    const progres=progression(actuelle,toutesEnigmes);
    plan.reponse=`Partie ${actuelle.session_id} · affaire ${actuelle.scenario_id} · ${membres(actuelle).length}/${actuelle.nombre_joueurs} joueurs · ${actuelle.statut==='accueil'?'inscriptions ouvertes':'échanges ouverts'}.`;
    if(actuelle.statut==='en_cours'&&progres)plan.reponse+=` ${progres.validees.length}/5 énigmes résolues. /enigme, /indice, /carnet.`;
  }
} else if(source.texte.startsWith('/')) plan.reponse=aide;
else if(!actuelle) plan.reponse='Rejoignez d’abord une partie avec son code. '+aide;
else if(actuelle.statut!=='en_cours') plan.reponse=`Vous êtes inscrit à ${actuelle.session_id}. Attendez que l’organisateur envoie /demarrer.`;
else {
  const joueur=membres(actuelle).find(j=>String(j.telegram_chat_id)===source.telegram_chat_id);
  if(!joueur)plan.reponse='Votre inscription n’est pas confirmée pour cette partie.';
  else {
    const progres=progression(actuelle,toutesEnigmes),affaire=AFFAIRES.find(a=>String(a.id)===String(actuelle.scenario_id));
    const cadre_enigme={affaire:affaire?.title,canon:affaire?.canon,
      active:progres?.active?{etape:progres.active.etape,enonce:progres.active.enonce,indice:indicePrive(progres.active,source.telegram_chat_id)}:null,
      carnet:progres?carnet(progres):'Énigmes non initialisées.'};
    plan={...plan,action:'dialogue',session_id:actuelle.session_id,session:actuelle,joueur,prenom:joueur.prenom||source.prenom,cadre_enigme};
  }
}
return [{json:plan}];
