// Le moteur n8n conserve les réponses. Le contexte IA reçoit seulement l'énoncé
// courant, l'indice de son destinataire et les réponses déjà validées.
function normaliserReponse(texte){return String(texte).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function heure(minutes){const m=((minutes%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function creerEnigmes(session,participants){
  const affaire=AFFAIRES.find(a=>String(a.id)===String(session.scenario_id));
  if(!affaire)throw Error('Affaire inconnue');
  const choisir=liste=>liste[Math.floor(Math.random()*liste.length)];
  const nom=choisir(['ALMA','IRIS','LYRA','NORA','ELIA','LINA','ROSE','ANNA']);
  const signes=melanger(['LUNE','CENDRE','RONCE','VERRE']);
  const objets=melanger(['CLE','MONTRE','MIROIR','MEDAILLON']);
  const objetsTraits=melanger([
    ['argent','froid','spirale'],['cuivre','chaud','cercle'],
    ['argent','chaud','etoile'],['cuivre','froid','croix']
  ]);
  const choisi=Math.floor(Math.random()*4),objet=objets[choisi],traits=objetsTraits[choisi];
  const reference=20*60+Math.floor(Math.random()*150),decalage=choisir([-17,-12,-7,8,12,19]);
  const evenement=reference+25+Math.floor(Math.random()*45),vraieHeure=heure(evenement);
  const etapes=[
    {titre:'Le nom effacé',enonce:'Quatre fragments portent les positions 1 à 4 d’un nom gravé sous le plâtre. Rassemblez les lettres dans cet ordre. Quel est ce nom ? Ce nom appartient à un personnage des archives, pas à un joueur.',solution:nom,
      indices:[...nom].map((lettre,i)=>`Fragment authentifié : position ${i+1} du nom = ${lettre}.`)},
    {titre:'Les quatre marques',enonce:'Les marques LUNE, CENDRE, RONCE et VERRE doivent être prononcées dans un seul ordre. Les inscriptions disent « immédiatement », sans place intermédiaire. Donnez les quatre mots dans l’ordre.',solution:signes.join(' '),
      indices:[`La première marque est ${signes[0]}.`,...signes.slice(0,3).map((s,i)=>`${s} se trouve immédiatement avant ${signes[i+1]}.`)]},
    {titre:'L’objet d’ancrage',enonce:'Une archive décrit quatre objets. Les trois propriétés de l’ancre doivent toutes correspondre. Les photographies servent d’ambiance ; leurs détails ne remplacent pas ce registre.\n'+objets.map((o,i)=>`${o} : ${objetsTraits[i].join(', ')}.`).join('\n')+'\nQuel objet est l’ancre ?',solution:objet,
      indices:[`L’ancre est en ${traits[0]}.`,`Au toucher, l’ancre est ${traits[1]}.`,`Sa gravure représente : ${traits[2]}.`,'Le registre a été vérifié : les trois propriétés désignent le même objet. Aucune règle ne vient de la couleur d’une photographie.']},
    {titre:'L’heure derrière le mur',enonce:'La pendule du couloir garde un décalage constant avec l’horloge de référence. Corrigez son heure pour retrouver l’instant où la faille s’est ouverte. Donnez HH:MM, au format 24 heures.',solution:vraieHeure,
      indices:[`Au premier coup frappé, l’horloge de référence indiquait ${heure(reference)}.`,`Au même premier coup, la pendule du couloir indiquait ${heure(reference+decalage)}.`,`À l’ouverture de la faille, cette même pendule du couloir indiquait ${heure(evenement+decalage)}.`,'Le décalage est constant : heure de référence = heure du couloir − (heure du couloir au premier coup − heure de référence au premier coup).']},
    {titre:'La formule du seuil',enonce:'Les quatre réponses validées sont dans /carnet. Reconstituez la formule du seuil à partir des quatre instructions privées. Respectez l’ordre NOM OBJET HEURE MARQUE. Cela prépare le rituel ; aucun joueur réel ne doit être désigné ou sacrifié.',solution:`${nom} ${objet} ${vraieHeure} ${signes[1]}`,
      indices:['NOM : reprenez le nom reconstitué à l’énigme 1.','OBJET : reprenez l’ancre identifiée à l’énigme 3.','HEURE : reprenez l’heure corrigée à l’énigme 4.','MARQUE : utilisez seulement la deuxième marque de la suite validée à l’énigme 2.']}
  ];
  return etapes.map((e,i)=>{
    const destinataires=melanger(participants),fragments=melanger(e.indices);
    const indices={};destinataires.forEach((j,k)=>{indices[String(j.telegram_chat_id)]=fragments[k%fragments.length]});
    return {session_id:session.session_id,etape:String(i+1),titre:e.titre,
      enonce:`Affaire ${affaire.id} — ${affaire.title}\n${affaire.stages[i]}\n\n${e.enonce}`,
      solution:e.solution,indices_json:JSON.stringify(indices),statut:'a_resoudre'};
  });
}
function progression(session,lignes){
  const etapes=lignes.filter(e=>e.session_id===session.session_id).sort((a,b)=>Number(a.id||0)-Number(b.id||0));
  // Refuser une base incomplète/dupliquée plutôt que créer un nouvel état implicite.
  if(etapes.length!==5||[1,2,3,4,5].some(n=>etapes.filter(e=>e.etape===String(n)).length!==1))return null;
  const ordonnees=etapes.sort((a,b)=>Number(a.etape)-Number(b.etape));
  if(ordonnees.some(e=>!['a_resoudre','resolue'].includes(e.statut)))return null;
  const active=ordonnees.find(e=>e.statut!=='resolue');
  const validees=active?ordonnees.slice(0,Number(active.etape)-1):ordonnees;
  return {active,validees,terminee:!active};
}
function indicePrive(enigme,chat){
  try{return JSON.parse(enigme.indices_json)[String(chat)]||'Indice absent : prévenir l’organisateur.'}catch{return 'Indice illisible : prévenir l’organisateur.'}
}
function carnet(progres){return progres.validees.length?progres.validees.map(e=>`${e.etape}. ${e.titre} : ${e.solution}`).join('\n'):'Aucune réponse n’a encore été validée.'}
function gererEnigmes(commande,argumentsCommande,session,participant,lignes){
  const progres=progression(session,lignes);
  if(!progres)return {reponse:'Les énigmes ne sont pas initialisées pour cette partie. Prévenez l’organisateur ; créez une nouvelle partie avec la version à cinq énigmes.'};
  if(commande==='/carnet')return {reponse:'Carnet commun\n'+carnet(progres)};
  if(progres.terminee)return {reponse:'Les cinq énigmes sont résolues. La formule du seuil est reconstituée. Le vote final et les victoires des camps ne sont pas encore automatisés. /carnet pour relire les réponses, /fin pour terminer le test.'};
  const active=progres.active;
  if(commande==='/enigme')return {reponse:`Énigme ${active.etape}/5 — ${active.titre}\n${active.enonce}\n\nChacun : /indice. Après discussion, un joueur envoie /repondre ${active.etape} VOTRE REPONSE.`};
  if(commande==='/indice')return {reponse:`Ton indice privé — énigme ${active.etape}/5\n${indicePrive(active,participant.telegram_chat_id)}\nComparez vos fragments. Ne suppose pas qu’un autre fragment est identique au tien.`};
  const numero=argumentsCommande[0],reponse=argumentsCommande.slice(1).join(' ');
  if(numero!==active.etape)return {reponse:`L’énigme active est la ${active.etape}. Consultez /enigme, puis /repondre ${active.etape} VOTRE REPONSE. Aucune étape n’a été modifiée.`};
  if(!reponse.trim())return {reponse:`Il manque la réponse : /repondre ${active.etape} VOTRE REPONSE.`};
  if(normaliserReponse(reponse)!==normaliserReponse(active.solution))return {reponse:'La maison ne cède pas. Cette réponse ne correspond pas aux archives. Comparez vos indices et réessayez ; aucun fragment n’a été supprimé.'};
  return {enigmes_a_ecrire:[{...active,statut:'resolue'}],reponse:`Énigme ${active.etape}/5 validée. Réponse ajoutée au carnet commun. `+(active.etape==='5'?'Les cinq sceaux sont reconstitués. Le rituel est prêt ; le vote final et les victoires des camps restent à raccorder.':`Passez à l’énigme ${Number(active.etape)+1} avec /enigme ; chacun doit redemander /indice.`)};
}
