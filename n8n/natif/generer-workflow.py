import json
from pathlib import Path
import uuid

ROOT=Path(__file__).resolve().parent
def node(name,kind,params,x,version=1,y=0,**extra):
    return {'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/natif/'+name)),'name':name,
      'type':'n8n-nodes-base.'+kind,'typeVersion':version,'position':[x,y],'parameters':params,**extra}
def code(name,file,x):
    return node(name,'code',{'mode':'runOnceForAllItems','jsCode':(ROOT/file).read_text(encoding='utf-8')},x,2)
def expr(value):return '={{ '+value+' }}'
SOURCE='$("Preparer le message").first().json'
SCOPE=[('session_id',expr(SOURCE+'.session_id')),('telegram_chat_id',expr(SOURCE+'.telegram_chat_id'))]
def table(name,operation,which,x,filters=None,values=None,extra=None):
    parameters={'resource':'row','operation':operation,
      'dataTableId':{'__rl':True,'mode':'list','value':'','cachedResultName':which}}
    if filters is not None:
        parameters.update(matchType='allConditions',filters={'conditions':[
          {'keyName':key,'condition':'eq','keyValue':value} for key,value in filters]})
    if values is not None:
        schema=[{'id':key,'displayName':key,'required':False,'defaultMatch':False,'display':True,
                 'type':'string','canBeUsedToMatch':True} for key in values]
        parameters['columns']={'mappingMode':'defineBelow','value':values,'matchingColumns':[],
                              'schema':schema,'attemptToConvertTypes':False,'convertFieldsToString':False}
    if extra: parameters.update(extra)
    return node(name,'dataTable',parameters,x)

incoming={'session_id':expr(SOURCE+'.session_id'),'telegram_chat_id':expr(SOURCE+'.telegram_chat_id'),
          'sens':'entrant','type_message':'texte','contenu':expr(SOURCE+'.texte'),
          'telegram_message_id':expr(SOURCE+'.telegram_message_id'),'statut':'recu'}
outgoing={key:expr('$json.'+key) for key in incoming}
nodes=[
 node('Reception Telegram','telegramTrigger',{'updates':['message'],'additionalFields':{}},0,1.2,
      webhookId=str(uuid.uuid4())),
 code('Preparer le message','preparer-message.js',230),
 table('Ignorer un message deja recu','rowNotExists','jeu_messages',460,
       SCOPE+[('telegram_message_id',expr(SOURCE+'.telegram_message_id')),('sens','entrant')]),
 table('Enregistrer le joueur','upsert','jeu_joueurs',690,SCOPE,
       {'session_id':expr(SOURCE+'.session_id'),'telegram_chat_id':expr(SOURCE+'.telegram_chat_id'),'prenom':expr(SOURCE+'.prenom')}),
 table('Memoriser le message entrant','insert','jeu_messages',920,values=incoming),
 table('Lire historique de ce joueur','get','jeu_messages',1150,SCOPE,extra={'returnAll':True}),
 code('Preparer le contexte de Sally','preparer-contexte.js',1380),
 node('Appeler IA','if',{'conditions':{'options':{'caseSensitive':True,'typeValidation':'strict','version':2},
     'conditions':[{'id':str(uuid.uuid4()),'leftValue':'={{ $json.needs_ai }}','rightValue':True,
       'operator':{'type':'boolean','operation':'true','singleValue':True}}],'combinator':'and'},'options':{}},1610,2.2),
 node('Agent Sally - OpenAI','httpRequest',{'method':'POST','url':'https://api.openai.com/v1/responses',
      'authentication':'predefinedCredentialType','nodeCredentialType':'openAiApi','sendBody':True,
      'contentType':'json','specifyBody':'json','jsonBody':'={{ $json.request }}',
      'options':{'timeout':90000,'response':{'response':{'neverError':True,'responseFormat':'json'}}}},1840,4.2,
      onError='continueRegularOutput'),
 code('Valider la reponse de Sally','valider-reponse.js',2070),
 node('Repondre sur Telegram','telegram',{'resource':'message','operation':'sendMessage',
      'chatId':'={{ $json.telegram_chat_id }}','text':'={{ $json.telegram_html }}',
      'additionalFields':{'parse_mode':'HTML','appendAttribution':False}},2300,1.2,onError='continueRegularOutput'),
 code('Preparer le journal de sortie','preparer-journal.js',2530),
 table('Memoriser la reponse envoyee','insert','jeu_messages',2760,values=outgoing),
 node('Configuration du workflow','stickyNote',{'content':
   '## Configuration après import\n1. Choisir votre credential Telegram dans Reception Telegram et Repondre sur Telegram.\n2. Choisir votre credential OpenAI dans Agent Sally - OpenAI.\n3. Choisir jeu_joueurs dans Enregistrer le joueur.\n4. Choisir jeu_messages dans les QUATRE autres nœuds Data Table. Toutes les expressions sont déjà remplies.\n\nMême projet n8n que les tables. Session TEST-001, seul David autorisé. Textes seulement, pas de nouveau serveur.\nDésactiver les anciens workflows Telegram utilisant ce bot avant le test.\nHistorique persistant dans les tables ; seuls 12 derniers messages sont envoyés à l’IA.\nNe pas importer les anciens workflows serveur-jeu : ils nécessitent le service que nous avons arrêté.',
    'width':1120,'height':390},0,y=280),
 node('Limites de cette version','stickyNote',{'content':
   '## Test de conversation avec mémoire\nCe workflow ne crée pas encore de vraie partie, ne distribue pas les rôles et ne pilote pas les énigmes. Il préserve les champs rôle/camp/photo existants et ne fournit aucun secret d’un autre joueur au modèle.\nLe contrôle des messages déjà reçus évite les doublons séquentiels ; ce contrôle et l’insertion ne sont pas une transaction atomique. Ne pas exécuter plusieurs copies du workflow.\nAucune relance automatique d’un envoi Telegram incertain. Le journal « erreur » signifie non confirmé. Vérifier la conversation avant toute relance manuelle.\nNe pas confondre mémoire de jeu et historique d’exécution n8n.',
    'width':1120,'height':360},1380,y=280)
]
chain=['Reception Telegram','Preparer le message','Ignorer un message deja recu','Enregistrer le joueur',
       'Memoriser le message entrant','Lire historique de ce joueur','Preparer le contexte de Sally','Appeler IA',
       'Agent Sally - OpenAI','Valider la reponse de Sally','Repondre sur Telegram','Preparer le journal de sortie','Memoriser la reponse envoyee']
connections={a:{'main':[[{'node':b,'type':'main','index':0}]]} for a,b in zip(chain,chain[1:])}
connections['Appeler IA']['main'].append([{'node':'Valider la reponse de Sally','type':'main','index':0}])
workflow={'name':'Tu Etais La - Sally et memoire dans n8n','nodes':nodes,'connections':connections,
          'active':False,'pinData':{},'settings':{'executionOrder':'v1','saveDataSuccessExecution':'none',
          'saveDataErrorExecution':'none','saveManualExecutions':False},'tags':[]}
if __name__=='__main__':
    target=ROOT.parent/'sally-memoire-n8n.json'
    target.write_text(json.dumps(workflow,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Workflow natif n8n généré sans clé ni service externe de mémoire.')
