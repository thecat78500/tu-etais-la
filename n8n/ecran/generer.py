import copy
import json
from pathlib import Path
import uuid

ROOT=Path(__file__).resolve().parent
base=json.loads((ROOT.parent/'sally-parties-n8n.json').read_text(encoding='utf-8'))
def node(name,kind,params,position,version=1,**extra):
    return dict(id=str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/ecran/'+name)),name=name,type='n8n-nodes-base.'+kind,typeVersion=version,position=position,parameters=params,**extra)
def code(name,file,x):return node(name,'code',{'mode':'runOnceForAllItems','jsCode':(ROOT/file).read_text(encoding='utf-8')},[x,0],2)
def table(name,source,value,x):
    n=copy.deepcopy(next(n for n in base['nodes'] if n['name']==source))
    n.update(name=name,id=str(uuid.uuid4()),position=[x,0])
    n['parameters']['filters']={'conditions':[{'keyName':'session_id','condition':'eq','keyValue':value}]}
    n['parameters']['matchType']='allConditions'
    return n
nodes=[
 node('Ecran Webhook','webhook',{'httpMethod':'POST','path':'tu-etais-la/ecran','responseMode':'responseNode','options':{'allowedOrigins':'https://thecat78500.github.io,http://127.0.0.1:8765,http://localhost:8765'}},[0,0],2,webhookId=str(uuid.uuid4())),
 table('Ecran session','Lire les parties','={{ typeof $json.body?.partie === "string" && /^M[A-Z0-9]{7}$/.test($json.body.partie.trim().toUpperCase()) ? $json.body.partie.trim().toUpperCase() : "INVALIDE" }}',240),
 code('Autoriser ecran','autoriser.js',480),
 node('Acces accepte','if',{'conditions':{'options':{'caseSensitive':True,'typeValidation':'strict','version':2},'conditions':[{'id':str(uuid.uuid4()),'leftValue':'={{ $json.autorise === true }}','rightValue':True,'operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}},[720,0],2.2),
 table('Ecran participants','Lire les participants','={{ $("Autoriser ecran").first().json.session_id }}',960),
 table('Ecran enigmes','Lire les enigmes','={{ $("Autoriser ecran").first().json.session_id }}',1200),
 code('Preparer ecran public','preparer.js',1440),
 node('Retour ecran','respondToWebhook',{'respondWith':'json','responseBody':'={{ $json }}','options':{'responseCode':200,'responseHeaders':{'entries':[{'name':'Cache-Control','value':'no-store'},{'name':'Referrer-Policy','value':'no-referrer'}]}}},[1680,0],1.4),
 node('Refuser ecran','respondToWebhook',{'respondWith':'json','responseBody':'={{ {ok:false,erreur:"Accès refusé. Vérifiez le code et l’association de cet écran."} }}','options':{'responseCode':403,'responseHeaders':{'entries':[{'name':'Cache-Control','value':'no-store'}]}}},[960,250],1.4),
 node('Connexion du site','stickyNote',{'content':'## Écran collectif — lecture seule\nPOST /webhook/tu-etais-la/ecran\nFormulaire : partie=CODE&cle=CLE_ASSOCIATION\nSélectionner jeu_sessions / jeu_joueurs / jeu_enigmes dans les trois nœuds Data Table.\nAjouter ecran_token (String) à jeu_sessions et importer aussi la version Telegram avec /ipad.\nAucun credential API à exposer dans GitHub. Réponse sur liste blanche, sans camps ni indices privés.\nWorkflow séparé : peut rester actif en même temps que le workflow Telegram.','width':900,'height':330},[0,-420])
]
connections={}
def edge(a,b,branch=0):
    out=connections.setdefault(a,{}).setdefault('main',[])
    while len(out)<=branch:out.append([])
    out[branch].append({'node':b,'type':'main','index':0})
chain=['Ecran Webhook','Ecran session','Autoriser ecran','Acces accepte','Ecran participants','Ecran enigmes','Preparer ecran public','Retour ecran']
for a,b in zip(chain,chain[1:]):edge(a,b)
edge('Acces accepte','Refuser ecran',1)
w=dict(name='Tu Etais La - Ecran collectif iPad',nodes=nodes,connections=connections,active=False,settings=base['settings'])
(ROOT.parent/'sally-ecran-n8n.json').write_text(json.dumps(w,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Workflow de lecture pour le site préparé ; aucun déploiement effectué.')
