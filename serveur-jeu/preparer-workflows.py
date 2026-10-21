"""Génère les exports n8n sans secrets ni identifiants de credentials locaux."""
import json
import uuid
from pathlib import Path

ROOT=Path(__file__).resolve().parent
API='http://127.0.0.1:8790'
def node(name,kind,parameters,x,y=0,version=1,**extra):
    return {'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/'+name)), 'name':name,
            'type':'n8n-nodes-base.'+kind,'typeVersion':version,'position':[x,y],'parameters':parameters,**extra}
def internal(name,path,body,x,y=0):
    return node(name,'httpRequest',{'method':'POST','url':API+path,
      'authentication':'genericCredentialType','genericAuthType':'httpHeaderAuth','sendBody':True,
      'specifyBody':'json','jsonBody':body,'options':{'timeout':20000}},x,y,4.2)
def condition(name,expression,x,y=0):
    return node(name,'if',{'conditions':{'options':{'caseSensitive':True,'typeValidation':'strict','version':2},
      'conditions':[{'id':str(uuid.uuid4()),'leftValue':expression,'rightValue':True,
       'operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}},x,y,2.2)
def workflow(name,nodes,edges):
    connections={}
    for src,dst,branch in edges:
        output=connections.setdefault(src,{'main':[]})['main']
        while len(output)<=branch: output.append([])
        output[branch].append({'node':dst,'type':'main','index':0})
    return {'name':name,'nodes':nodes,'connections':connections,'active':False,'pinData':{},
       'settings':{'executionOrder':'v1','saveDataSuccessExecution':'none','saveDataErrorExecution':'none','saveManualExecutions':False},'tags':[]}

inbox=[
 node('Recevoir Telegram','telegramTrigger',{'updates':['message'],'additionalFields':{}},0,version=1.2,webhookId=str(uuid.uuid4())),
 internal('Memoriser et preparer','/telegram','={{ $json }}',250),
 condition('Sally doit repondre','={{ $json.needs_ai }}',500),
 node('Agent Sally - OpenAI','httpRequest',{'method':'POST','url':'https://api.openai.com/v1/responses',
      'authentication':'predefinedCredentialType','nodeCredentialType':'openAiApi','sendBody':True,
      'specifyBody':'json','jsonBody':'={{ $json.request }}',
      'options':{'timeout':90000,'response':{'response':{'neverError':True,'responseFormat':'json'}}}},750,version=4.2,onError='continueRegularOutput'),
 internal('Valider la reponse et mettre en attente','/ai/complete',
      '={{ { event_id: $("Memoriser et preparer").first().json.event_id, response: $json } }}',1000),
 node('Configuration reception','stickyNote',{'content':
      '## À configurer\n- Recevoir Telegram : credential du bot existant.\n- Les 2 appels locaux : Header Auth Mémoire du jeu.\n- Agent Sally : credential OpenAI EXISTANT.\n\nCommandes : /creer 4 1, /rejoindre CODE Pseudo, /demarrer.\nLa réponse est stockée dans la boîte d’envoi : activer aussi 02-expedition.json.\nUn seul workflow Telegram en écoute pour ce bot.\nPas d’outils donnés au modèle : aucune modification des camps, étapes ou destinataires par l’IA.',
      'width':1000,'height':310},0,250)
]
inbox_edges=[('Recevoir Telegram','Memoriser et preparer',0),('Memoriser et preparer','Sally doit repondre',0),
             ('Sally doit repondre','Agent Sally - OpenAI',0),('Agent Sally - OpenAI','Valider la reponse et mettre en attente',0)]

delivery_ref='$("Chaque envoi").item.json'
dispatcher=[
 node('Toutes les 10 secondes','scheduleTrigger',{'rule':{'interval':[{'field':'seconds','secondsInterval':10}]}},0,version=1.2),
 internal('Reserver les envois','/outbox/claim','={{ {} }}',250),
 node('Chaque envoi','splitOut',{'fieldToSplitOut':'deliveries','options':{}},500),
 condition('Message texte','={{ $json.kind === "text" }}',750),
 node('Envoyer le texte','telegram',{'resource':'message','operation':'sendMessage','chatId':'={{ $json.chat_id }}',
      'text':"={{ $json.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}",'additionalFields':{'appendAttribution':False,'parse_mode':'HTML'}},1000,-100,1.2,onError='continueRegularOutput'),
 internal('Confirmer le texte','/outbox/ack',
      '={{ { delivery_id: '+delivery_ref+'.delivery_id, lease: '+delivery_ref+'.lease, result: $json } }}',1250,-100),
 node('Lire le vocal','readWriteFile',{'operation':'read','fileSelector':'={{ $json.path }}','options':{'dataPropertyName':'data'}},1000,150,1,onError='continueRegularOutput'),
 node('Envoyer le vocal','httpRequest',{'method':'POST',
      'url':'https://api.telegram.org/botREMPLACER_PAR_VOTRE_JETON/sendVoice',
      'authentication':'none','sendBody':True,'contentType':'multipart-form-data',
      'bodyParameters':{'parameters':[{'name':'chat_id','value':'={{ '+delivery_ref+'.chat_id }}'},
       {'parameterType':'formBinaryData','name':'voice','inputDataFieldName':'data'}]},
      'options':{'timeout':60000,'response':{'response':{'neverError':True,'responseFormat':'json'}}}},1250,150,4.2,onError='continueRegularOutput'),
 internal('Confirmer le vocal','/outbox/ack',
      '={{ { delivery_id: '+delivery_ref+'.delivery_id, lease: '+delivery_ref+'.lease, result: $json } }}',1500,150),
 node('Configuration expedition','stickyNote',{'content':
      '## À configurer\n- Les 3 appels locaux : Header Auth Mémoire du jeu.\n- Envoyer le texte : credential Telegram EXISTANT.\n- Envoyer le vocal : remplacer le jeton dans l’URL localement ; ne jamais publier l’export configuré.\n\nLa boîte persistante réserve un seul envoi à la fois par conversation. Un envoi non confirmé reste « uncertain » : vérifier avec admin.py. Pas de retry automatique sur une erreur réseau.\nLes chuchotements sont 6 textes d’ambiance préparés (2–4 min), puis s’arrêtent. Réponses libres : Agent Sally dans le workflow de réception.',
      'width':1000,'height':330},0,400)
]
dispatcher_edges=[('Toutes les 10 secondes','Reserver les envois',0),('Reserver les envois','Chaque envoi',0),
 ('Chaque envoi','Message texte',0),('Message texte','Envoyer le texte',0),('Envoyer le texte','Confirmer le texte',0),
 ('Message texte','Lire le vocal',1),('Lire le vocal','Envoyer le vocal',0),('Envoyer le vocal','Confirmer le vocal',0)]

if __name__=='__main__':
    for filename,content in [('01-reception-ia.json',workflow('Tu Etais La - Reception et agent Sally',inbox,inbox_edges)),
                             ('02-expedition.json',workflow('Tu Etais La - Expedition persistante',dispatcher,dispatcher_edges))]:
        (ROOT/filename).write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    scenarios=ROOT.parent/'audio-scripts/bibliotheque-v2/scenarios.json'
    (ROOT/'scenarios.json').write_text(scenarios.read_text(encoding='utf-8'),encoding='utf-8')
    print('Workflows n8n et scénarios préparés, aucun secret inclus.')
