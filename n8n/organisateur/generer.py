import copy
import json
from pathlib import Path
import uuid

ROOT=Path(__file__).resolve().parent
base=json.loads((ROOT.parent/'sally-parties-n8n.json').read_text(encoding='utf-8'))
by_name={n['name']:n for n in base['nodes']}
def node(name,kind,params,x,y=0,version=1,**extra):
    return dict(id=str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/organisateur/'+name)),name=name,type='n8n-nodes-base.'+kind,typeVersion=version,position=[x,y],parameters=params,**extra)
def code(name,js,x,y=0):return node(name,'code',{'mode':'runOnceForAllItems','jsCode':js},x,y,2)
def gate(name,expression,x,y=0):
    n=copy.deepcopy(by_name['Dialogue autorise']);n.update(name=name,id=str(uuid.uuid4()),position=[x,y]);n['parameters']['conditions']['conditions'][0]['leftValue']='={{ '+expression+' }}';return n
def repondre(name,body,status,x,y=0):return node(name,'respondToWebhook',{'respondWith':'json','responseBody':body,'options':{'responseCode':status,'responseHeaders':{'entries':[{'name':'Cache-Control','value':'no-store'}]}}},x,y,1.4)
keep=['Lire les parties','Lire les participants','Lire les enigmes','Planifier la partie','Memoriser le message entrant','Ecrire les enigmes','Preparer les enigmes','Enregistrer les enigmes','Confirmer les enigmes','Mettre a jour la partie','Distribuer les roles','Preparer les roles','Enregistrer les roles','Confirmer la distribution','Enregistrer la partie','Inscription demandee','Inscrire le participant','Lire les places occupees','Verifier la place disponible','Place confirmee','Retrait demande','Retirer inscription','Dialogue autorise','Preparer notification']
nodes=[copy.deepcopy(by_name[n]) for n in keep]
for n in nodes:n['id']=str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/organisateur/'+n['name']))
# Même planificateur et mêmes écritures que Telegram ; seul le transport change.
nodes.extend([
 node('Organisateur Webhook','webhook',{'httpMethod':'POST','path':'tu-etais-la/organisateur','authentication':'headerAuth','responseMode':'responseNode','options':{'allowedOrigins':'https://thecat78500.github.io,http://127.0.0.1:8765,http://localhost:8765'}},-1000,0,2,webhookId=str(uuid.uuid4())),
 code('Normaliser Telegram',(ROOT/'normaliser.js').read_text(encoding='utf-8'),-760),
 gate('Requete valide','!$json.erreur_web',-520),
 repondre('Requete refusee','={{ {ok:false,message:$("Normaliser Telegram").first().json.erreur_web} }}',400,-280,300),
 gate('Lecture seulement','$("Normaliser Telegram").first().json.action_web === "etat"',1400,-900),
 gate('Deja traitee','$input.all().some(i=>i.json.telegram_message_id)',1800,-900),
])
verification=copy.deepcopy(by_name['Verifier evenement Telegram'])
verification.update(id=str(uuid.uuid4()),position=[1600,-900],alwaysOutputData=True)
verification['parameters'].update(operation='get',returnAll=True)
nodes.append(verification)
# Relire les données après les écritures : ne pas renvoyer un état avant mutation.
for name,source,x in [('Relire les parties','Lire les parties',3900),('Relire les participants','Lire les participants',4140),('Relire les enigmes','Lire les enigmes',4380)]:
    n=copy.deepcopy(by_name[source]);n.update(name=name,id=str(uuid.uuid4()),position=[x,-900]);nodes.append(n)
projection=(ROOT.parent/'ecran/preparer.js').read_text(encoding='utf-8')
projection=projection.replace("const session=$('Autoriser ecran').first().json.session;",'''const source=$('Normaliser Telegram').first().json;
const plan=$('Planifier la partie').first().json;
const sessions=$('Relire les parties').all().map(i=>i.json);
const session=sessions.filter(s=>String(s.organisateur_chat_id)===source.telegram_chat_id&&['accueil','en_cours'].includes(s.statut)).sort((a,b)=>Number(b.id||0)-Number(a.id||0))[0];
let doublon=false;try{doublon=$('Verifier evenement Telegram').all().some(i=>i.json.telegram_message_id)}catch{}
const message=doublon?'Cette demande a déjà été reçue. L’état actuel a été relu, sans répéter l’action.':plan.reponse;
if(!session)return [{json:{ok:true,message,partie:null,joueurs:[],progression:{initialise:false,resolues:0,total:5,active:null,carnet:[]}}}];''')
projection=projection.replace("$('Ecran participants')","$('Relire les participants')")
projection=projection.replace('ok:true,partie:{','ok:true,message,partie:{')
nodes.append(code('Etat organisateur public',projection,4620,-900))
nodes.append(repondre('Retour organisateur','={{ $json }}',200,4860,-900))
connections={}
def edge(a,b,branch=0):
    outputs=connections.setdefault(a,{}).setdefault('main',[])
    while len(outputs)<=branch:outputs.append([])
    outputs[branch].append({'node':b,'type':'main','index':0})
# Reprendre les branches de mutation du workflow testé, sans agent ni envoi Telegram.
names=set(keep)
for a,c in base['connections'].items():
    if a not in names:continue
    for branche,edges in enumerate(c.get('main',[])):
        for e in edges:
            if e['node'] in names:edge(a,e['node'],branche)
connections['Planifier la partie']={}
edge('Organisateur Webhook','Normaliser Telegram');edge('Normaliser Telegram','Requete valide')
edge('Requete valide','Lire les parties');edge('Requete valide','Requete refusee',1)
edge('Planifier la partie','Lecture seulement');edge('Lecture seulement','Relire les parties');edge('Lecture seulement','Verifier evenement Telegram',1)
edge('Verifier evenement Telegram','Deja traitee');edge('Deja traitee','Relire les parties');edge('Deja traitee','Memoriser le message entrant',1)
edge('Preparer notification','Relire les parties')
edge('Dialogue autorise','Preparer notification') # Cette branche est impossible avec les actions autorisées.
edge('Relire les parties','Relire les participants');edge('Relire les participants','Relire les enigmes');edge('Relire les enigmes','Etat organisateur public');edge('Etat organisateur public','Retour organisateur')
nodes.append(node('Installation organisateur','stickyNote',{'content':'## Contrôler le jeu depuis le site\nAucune nouvelle table. Même logique que Telegram, sans agent ni envoi Telegram.\nDans Organisateur Webhook : credential Header Auth, Name Authorization, Value Bearer VOTRE_CODE_SECRET. Code générable dans la configuration du site.\nSélectionner les tables dans les nœuds Data Table. Identité organisateur fixée à 6644853325 dans Normaliser Telegram.\nActions autorisées : etat / creer / demarrer / fin. Aucun chat_id ne vient du navigateur.\nPublier ce workflow en parallèle du workflow Telegram. URL /webhook/tu-etais-la/organisateur.','width':1000,'height':350},-1000,-500))
workflow=dict(name='Tu Etais La - Commandes organisateur du site',nodes=nodes,connections=connections,active=False,settings=base['settings'])
(ROOT.parent/'sally-organisateur-n8n.json').write_text(json.dumps(workflow,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Workflow organisateur préparé, sans secret et sans déploiement.')
