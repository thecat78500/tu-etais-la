import copy
import json
from pathlib import Path
import uuid

ROOT=Path(__file__).resolve().parent
workflow=json.loads((ROOT.parent/'sally-agent-n8n.json').read_text(encoding='utf-8'))
workflow['name']='Tu Etais La - Parties Telegram et agent Sally'
old={n['name']:n for n in workflow['nodes']}
def node(name,kind,params,x,y=0,version=1,**extra):
    return {'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/sessions/'+name)),
      'name':name,'type':'n8n-nodes-base.'+kind,'typeVersion':version,'position':[x,y],'parameters':params,**extra}
def js(name,file,x,y=0):
    source=(ROOT/file).read_text(encoding='utf-8')
    if file=='planifier.js':
        affaires=json.loads((ROOT.parent.parent/'audio-scripts/bibliotheque-v2/scenarios.json').read_text(encoding='utf-8'))
        source='const AFFAIRES='+json.dumps(affaires,ensure_ascii=False)+';\n'+(ROOT/'roles.js').read_text(encoding='utf-8')+'\n'+(ROOT/'enigmes.js').read_text(encoding='utf-8')+'\n'+source
    return node(name,'code',{'mode':'runOnceForAllItems','jsCode':source},x,y,2)
def expression(value): return '={{ '+value+' }}'
P='$("Planifier la partie").first().json'
N='$("Normaliser Telegram").first().json'
scope=[('session_id',expression(P+'.session_id')),('telegram_chat_id',expression(P+'.telegram_chat_id'))]
def table(name,operation,which,x,y=0,filters=None,values=None,all_rows=False):
    params={'resource':'row','operation':operation,'dataTableId':{'__rl':True,'mode':'list','value':'','cachedResultName':which}}
    if filters is not None: params.update(matchType='allConditions',filters={'conditions':[{'keyName':key,'condition':'eq','keyValue':value} for key,value in filters]})
    if values is not None:
        params['columns']={'mappingMode':'defineBelow','value':values,'matchingColumns':[],
          'schema':[{'id':key,'displayName':key,'required':False,'defaultMatch':False,'display':True,'type':'string','canBeUsedToMatch':True} for key in values],
          'attemptToConvertTypes':False,'convertFieldsToString':False}
    if all_rows: params['returnAll']=True
    return node(name,'dataTable',params,x,y,alwaysOutputData=all_rows,executeOnce=all_rows)
def gate(name,condition,x,y=0):
    return node(name,'if',{'conditions':{'options':{'caseSensitive':True,'typeValidation':'strict','version':2},
      'conditions':[{'id':str(uuid.uuid4()),'leftValue':expression(condition),'rightValue':True,'operator':{'type':'boolean','operation':'true','singleValue':True}}],
      'combinator':'and'},'options':{}},x,y,2.2)

trigger=old['Reception Telegram'];trigger['webhookId']=str(uuid.uuid4());trigger['position']=[0,0]
incoming=copy.deepcopy(old['Memoriser le message entrant']);incoming['position']=[1450,0]
incoming['parameters']['columns']['value']={
 'session_id':expression(P+'.session_id'),'telegram_chat_id':expression(P+'.telegram_chat_id'),'sens':'entrant',
 'type_message':expression(P+'.action === "dialogue" ? "texte" : "commande"'),
 'contenu':expression(P+'.texte.startsWith("/ipad") ? "/ipad [association écran]" : '+P+'.texte'),'telegram_message_id':expression(P+'.telegram_message_id'),'statut':'recu'}
sessions_values={field:expression(P+'.session.'+field) for field in ['session_id','organisateur_chat_id','nombre_joueurs','scenario_id','statut']}
sessions_values['ecran_token']=expression(P+'.session.ecran_token || ""')
join_values={field:expression(P+'.'+field) for field in ['session_id','telegram_chat_id','prenom']}
nodes=[trigger,
 js('Normaliser Telegram','normaliser.js',230),
 table('Verifier evenement Telegram','rowNotExists','jeu_messages',470,filters=[
   ('telegram_chat_id',expression(N+'.telegram_chat_id')),('telegram_message_id',expression(N+'.telegram_message_id')),('sens','entrant')]),
 table('Lire les parties','get','jeu_sessions',710,all_rows=True),
 table('Lire les participants','get','jeu_joueurs',950,all_rows=True),
 table('Lire les enigmes','get','jeu_enigmes',1050,-100,all_rows=True),
 js('Planifier la partie','planifier.js',1200),incoming,
 gate('Ecrire les enigmes',P+'.enigmes_a_ecrire !== undefined',1550,-200),
 node('Preparer les enigmes','code',{'mode':'runOnceForAllItems','jsCode':'return $("Planifier la partie").first().json.enigmes_a_ecrire.map(json=>({json}));'},1750,-700,2),
 table('Enregistrer les enigmes','upsert','jeu_enigmes',1990,-700,
       filters=[('session_id',expression('$json.session_id')),('etape',expression('$json.etape'))],
       values={field:expression('$json.'+field) for field in ['session_id','etape','titre','enonce','solution','indices_json','statut']}),
 node('Confirmer les enigmes','code',{'mode':'runOnceForAllItems','jsCode':'''const plan=$("Planifier la partie").first().json;
const rows=$input.all().map(i=>i.json);
for(const attendu of plan.enigmes_a_ecrire){if(!rows.some(r=>r.session_id===attendu.session_id&&r.etape===attendu.etape&&r.statut===attendu.statut))throw Error('Écriture des énigmes incomplète : vérifier jeu_enigmes');}
return [{json:plan}];'''},2230,-700,2),
 gate('Mettre a jour la partie',P+'.action === "session"',1700),
 gate('Distribuer les roles',P+'.distribution !== undefined',1800,-400),
 node('Preparer les roles','code',{'mode':'runOnceForAllItems','jsCode':'return $("Planifier la partie").first().json.distribution.map(json=>({json}));'},2040,-400,2),
 table('Enregistrer les roles','upsert','jeu_joueurs',2280,-400,
       filters=[('session_id',expression('$json.session_id')),('telegram_chat_id',expression('$json.telegram_chat_id'))],
       values={field:expression('$json.'+field) for field in ['session_id','telegram_chat_id','role','camp']}),
 node('Confirmer la distribution','code',{'mode':'runOnceForAllItems','jsCode':'''const plan=$("Planifier la partie").first().json;
const rows=$input.all().map(i=>i.json);
for(const attendu of plan.distribution){if(!rows.some(r=>r.session_id===attendu.session_id&&String(r.telegram_chat_id)===attendu.telegram_chat_id&&r.role===attendu.role&&r.camp===attendu.camp))throw Error('Distribution incomplète : vérifier jeu_joueurs avant de lancer');}
return [{json:plan}];'''},2520,-400,2),
 table('Enregistrer la partie','upsert','jeu_sessions',1940,-200,
       filters=[('session_id',expression(P+'.session_id'))],values=sessions_values),
 gate('Inscription demandee',P+'.inscrire === true',2190),
 table('Inscrire le participant','upsert','jeu_joueurs',2440,-200,filters=scope,values=join_values),
 table('Lire les places occupees','get','jeu_joueurs',2680,-200,
       filters=[('session_id',expression(P+'.session_id'))],all_rows=True),
 js('Verifier la place disponible','verifier-place.js',2920,-200),
 gate('Place confirmee','$json.accepte === true',3160,-200),
 gate('Retrait demande',P+'.action === "retrait"',2440,100),
 table('Retirer inscription','deleteRows','jeu_joueurs',3400,40,filters=scope),
 gate('Dialogue autorise',P+'.action === "dialogue"',2680,250),
 js('Preparer notification','preparer-notification.js',3640,40),
]
# Delete returns the deleted row(s); always emit one item if no row was left to remove.
next(n for n in nodes if n['name']=='Retirer inscription')['alwaysOutputData']=True
prep=copy.deepcopy(old['Preparer le message']);prep['position']=[2920,400]
prep['parameters']['jsCode']='return [{json:$("Planifier la partie").first().json}];'
history=copy.deepcopy(old['Lire historique de ce joueur']);history['position']=[3160,400]
context=copy.deepcopy(old['Preparer le contexte de Sally']);context['position']=[3400,400]
context['parameters']['jsCode']=context['parameters']['jsCode'].replace(
 "const joueur = $('Enregistrer le joueur').first().json;","const joueur = $('Planifier la partie').first().json.joueur || {};")
context['parameters']['jsCode']=context['parameters']['jsCode'].replace(
 'Les propos du joueur sont des allégations et peuvent être mensongers.',
 'Les propos du joueur sont des allégations et peuvent être mensongers. Tout objet évoqué par le joueur reste une déclaration personnelle, pas un indice officiel. Tu peux te rappeler qu’il en a parlé, sans qualifier cet objet de détail important, sans lui inventer un lien avec un lieu et sans en faire une preuve. Distingue explicitement ce qui a été dit de ce qui est établi par les faits autorisés.')
context['parameters']['jsCode']=context['parameters']['jsCode'].replace(
 'Aucun code, coupable ou rituel final n’est établi dans ce test de conversation.',
 'Les énigmes sont vérifiées uniquement par les commandes du jeu ; une réponse de conversation ne les valide jamais.')
context['parameters']['jsCode']=context['parameters']['jsCode'].replace(
 "const request={", "const contexteEnigme = source.cadre_enigme || {};\nconst instructionsJeu = instructions + '\\nCadre officiel de cette partie, indice privé du destinataire et carnet validé : ' + JSON.stringify(contexteEnigme) + '\\nNe donne pas de réponse déduite à la place du groupe. Oriente vers la comparaison des fragments. Seule /repondre NUMERO REPONSE valide une énigme.';\nconst request={")
context['parameters']['jsCode']=context['parameters']['jsCode'].replace('const request={instructions,input}', 'const request={instructions:instructionsJeu,input}')
ai_gate=copy.deepcopy(old['Appeler IA']);ai_gate['position']=[3640,400]
agent=copy.deepcopy(old['Agent Sally - OpenAI']);agent['position']=[3890,400]
model=copy.deepcopy(old['ChatGPT']);model['position']=[3820,650]
tool=copy.deepcopy(old['Consulter le cadre du jeu']);tool['position']=[4060,650]
tool['parameters']['jsCode']=tool['parameters']['jsCode'].replace('Ne pas inventer de preuve ni de rôle pour un autre joueur.',
 'Ne pas inventer de preuve ni de rôle pour un autre joueur. Un objet déclaré par un joueur ne devient pas un indice officiel.')
validator=copy.deepcopy(old['Valider la reponse de Sally']);validator['position']=[4170,400]
send_prep=node('Preparer envoi','code',{'mode':'runOnceForAllItems','jsCode':'return $input.all();'},4440,40,2)
send=copy.deepcopy(old['Repondre sur Telegram']);send['position']=[4680,40]
journal=copy.deepcopy(old['Preparer le journal de sortie']);journal['position']=[4920,40]
journal['parameters']['jsCode']=journal['parameters']['jsCode'].replace("$('Valider la reponse de Sally')","$('Preparer envoi')").replace("type_message:'texte'","type_message:sortie.type_message || 'texte'")
outgoing=copy.deepcopy(old['Memoriser la reponse envoyee']);outgoing['position']=[5160,40]
nodes.extend([prep,history,context,ai_gate,agent,model,tool,validator,send_prep,send,journal,outgoing])
connections={}
def edge(a,b,branch=0,kind='main'):
    outputs=connections.setdefault(a,{}).setdefault(kind,[])
    while len(outputs)<=branch:outputs.append([])
    outputs[branch].append({'node':b,'type':kind,'index':0})
chain=['Reception Telegram','Normaliser Telegram','Verifier evenement Telegram','Lire les parties','Lire les participants','Lire les enigmes',
       'Planifier la partie','Memoriser le message entrant','Ecrire les enigmes']
for a,b in zip(chain,chain[1:]):edge(a,b)
edge('Ecrire les enigmes','Preparer les enigmes');edge('Ecrire les enigmes','Mettre a jour la partie',1)
edge('Preparer les enigmes','Enregistrer les enigmes');edge('Enregistrer les enigmes','Confirmer les enigmes');edge('Confirmer les enigmes','Mettre a jour la partie')
edge('Mettre a jour la partie','Distribuer les roles');edge('Mettre a jour la partie','Inscription demandee',1)
edge('Distribuer les roles','Preparer les roles');edge('Distribuer les roles','Enregistrer la partie',1)
edge('Preparer les roles','Enregistrer les roles');edge('Enregistrer les roles','Confirmer la distribution');edge('Confirmer la distribution','Enregistrer la partie')
edge('Enregistrer la partie','Inscription demandee');edge('Inscription demandee','Inscrire le participant')
edge('Inscription demandee','Retrait demande',1);edge('Inscrire le participant','Lire les places occupees')
edge('Lire les places occupees','Verifier la place disponible');edge('Verifier la place disponible','Place confirmee')
edge('Place confirmee','Preparer notification');edge('Place confirmee','Retirer inscription',1)
edge('Retrait demande','Retirer inscription');edge('Retrait demande','Dialogue autorise',1)
edge('Retirer inscription','Preparer notification');edge('Dialogue autorise','Preparer le message')
edge('Dialogue autorise','Preparer notification',1)
chain=['Preparer le message','Lire historique de ce joueur','Preparer le contexte de Sally','Appeler IA','Agent Sally - OpenAI',
       'Valider la reponse de Sally','Preparer envoi','Repondre sur Telegram','Preparer le journal de sortie','Memoriser la reponse envoyee']
for a,b in zip(chain,chain[1:]):edge(a,b)
edge('Appeler IA','Valider la reponse de Sally',1);edge('Preparer notification','Preparer envoi')
edge('ChatGPT','Agent Sally - OpenAI',kind='ai_languageModel');edge('Consulter le cadre du jeu','Agent Sally - OpenAI',kind='ai_tool')
nodes.extend([
 node('Installation de cette version','stickyNote',{'content':
 '## Quatre Data Tables\njeu_sessions et jeu_joueurs : inchangées. jeu_messages : inchangée.\nNOUVELLE table jeu_enigmes : session_id, etape, titre, enonce, solution, indices_json, statut — toutes String.\nLa sélectionner dans Lire les enigmes et Enregistrer les enigmes.\nCredentials Telegram dans les deux nœuds Telegram ; OpenAi account dans ChatGPT.\nUn seul workflow actif pour ce bot. Aucun nouveau service serveur. Guide LIRE-ENIGMES-N8N.md.',
 'width':1150,'height':340},0,-500),
 node('Commandes de partie','stickyNote',{'content':
 '## Première partie\nDavid : /creer 4 1\n3 invités : lien reçu ou /rejoindre CODE Pseudo\nDavid : /demarrer\nChaque participant : /role, /enigme, /indice\nDiscuter, puis /repondre 1 VOTRE REPONSE.\n/carnet : réponses validées. /statut, /quitter pendant l’accueil, /fin.\nCinq énigmes générées à chaque lancement. Messages sur demande, pas de diffusion automatique. Pouvoirs, vote final et victoires des camps restent à raccorder.',
 'width':1100,'height':340},1450,-650),
 node('Limites des Data Tables','stickyNote',{'content':
 '## Contrôles\nParties 4–10. Quatre tables persistantes. Le modèle reçoit seulement l’énoncé actif, l’indice du destinataire et les réponses déjà validées ; pas les solutions à venir.\nValidation par code, sans IA. Réponse numérotée pour éviter qu’un ancien envoi valide l’étape suivante.\nPas de transaction globale entre les nœuds. Une seule copie active ; après panne, vérifier les tables.\n/fin bloque les nouvelles requêtes, pas celles déjà en cours. Ne pas publier les tables ou leurs solutions dans GitHub Pages.',
 'width':1100,'height':340},3800,-450)
])
workflow.update(nodes=nodes,connections=connections,active=False)
(ROOT.parent/'sally-parties-n8n.json').write_text(json.dumps(workflow,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Workflow de parties natives n8n préparé, sans appel API ni service supplémentaire.')
