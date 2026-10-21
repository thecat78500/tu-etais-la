// Attribution côté workflow : aucune décision de rôle n'est confiée à l'IA.
const REPARTITION={4:[2,1,1],5:[3,1,1],6:[3,2,1],7:[4,2,1],8:[4,2,2],9:[5,2,2],10:[5,3,2]};
const ROLES=[['Médium','Tu perçois les murmures de la maison.'],['Veilleur','Tu surveilles ce qui change autour du groupe.'],['Gardien','Tu protèges les souvenirs rassemblés.'],['Revenant','Ton passé semble lié à cette maison.'],['Archiviste','Tu cherches les contradictions dans les récits.'],['Écho','Tu prêtes attention aux paroles qui se répètent.'],['Cartographe','Tu observes les lieux et leurs transformations.'],['Porteur','Tu transportes un souvenir que la maison convoite.'],['Scribe','Tu conserves une trace des découvertes du groupe.'],['Témoin','Tu essaies de distinguer les souvenirs des illusions.']];
const CAMPS={gentil:'Tu veux aider le groupe à libérer Sally et à sortir de la maison.',mechant:'Tu sers la maison. Sème le doute et influence les décisions pour empêcher la libération de Sally. Tu peux mentir, mais pas détruire ou cacher définitivement les indices communs.',ambigu:'Tu hésites entre Sally et la maison. Ton objectif individuel sera défini avec les énigmes ; il n’est pas encore actif dans cette version de test.'};
function melanger(liste){const a=[...liste];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function distribuer(participants){
  const nombre=participants.length,compte=REPARTITION[nombre];
  if(!compte)throw Error('Nombre de participants invalide pour les rôles');
  const camps=melanger(['gentil','mechant','ambigu'].flatMap((camp,i)=>Array(compte[i]).fill(camp)));
  const roles=melanger(ROLES.slice(0,nombre).map(r=>r[0]));
  return participants.map((j,i)=>({session_id:j.session_id,telegram_chat_id:String(j.telegram_chat_id),role:roles[i],camp:camps[i]}));
}
function fiche(joueur){
  if(!joueur?.role||!CAMPS[joueur.camp])return 'Ta fiche n’est pas encore disponible. Demande à l’organisateur de vérifier la distribution.';
  const description=ROLES.find(r=>r[0]===joueur.role)?.[1]||'';
  return `Fiche privée — ${joueur.prenom||'Joueur'}\nRôle : ${joueur.role}\n${description}\nCamp : ${joueur.camp==='mechant'?'méchant':joueur.camp}\n${CAMPS[joueur.camp]}\nGarde ton camp secret. Le rôle et le camp sont indépendants : un Revenant peut être gentil.\nVersion de test : les pouvoirs, objectifs individuels et conditions de victoire ne sont pas encore automatisés.`;
}
