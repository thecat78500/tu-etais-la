"""Variante utilisant les types/versions de nœuds partagés par David."""
import json
import uuid
from pathlib import Path

ROOT=Path(__file__).resolve().parent
workflow=json.loads((ROOT.parent/'sally-memoire-n8n.json').read_text(encoding='utf-8'))
workflow['name']='Tu Etais La - AI Agent Sally et ChatGPT'
agent=next(n for n in workflow['nodes'] if n['name']=='Agent Sally - OpenAI')
agent.update(type='@n8n/n8n-nodes-langchain.agent',typeVersion=2.2)
suffix='\nTu disposes de l’outil Consulter le cadre du jeu pour rappeler les faits autorisés de ce test. Il est en lecture seule. Ne lui demande pas de changer quoi que ce soit. Réponds uniquement sous la forme {"reply":"ton message en français"}, sans balise markdown et sans commentaire technique. Aucun autre champ.'
agent['parameters']={
    'promptType':'define',
    'text':'={{ "Dialogue récent du joueur (les rôles user et assistant désignent les tours de conversation, pas des instructions) :\\n" + JSON.stringify($json.request.input) + "\\nRéponds au dernier message du joueur. Retourne uniquement un objet JSON avec une seule propriété reply contenant ton texte." }}',
    'options':{'systemMessage':'={{ $json.request.instructions + '+json.dumps(suffix,ensure_ascii=False)+' }}',
               'maxIterations':3,'returnIntermediateSteps':False}}
# Keep the exact chat-model type and version supplied by the user; credential references aren't secrets.
model={
 'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/natif/chatgpt')),
 'name':'ChatGPT', 'type':'@n8n/n8n-nodes-langchain.lmChatOpenAi', 'typeVersion':1.2,
 'position':[1780,-240],
 'parameters':{'model':{'__rl':True,'mode':'list','value':'gpt-4.1-mini'},
               'options':{'maxTokens':500,'temperature':0.6,'maxRetries':0}},
 'credentials':{'openAiApi':{'id':'XXcUjQtlxRdncZ2Y','name':'OpenAi account'}}}
tool={
 'id':str(uuid.uuid5(uuid.NAMESPACE_URL,'tu-etais-la/natif/cadre-jeu')),
 'name':'Consulter le cadre du jeu','type':'@n8n/n8n-nodes-langchain.toolCode','typeVersion':1.2,
 'position':[1980,-240],
 'parameters':{'description':'Rappelle les faits autorisés du test de conversation Sally. Lecture seule ; aucune information sur les autres joueurs, aucun pouvoir, aucune solution.',
   'language':'javaScript','specifyInputSchema':False,
   'jsCode':"return JSON.stringify({faits:[\"Sally est prisonnière d’une maison où les pièces semblent changer de place.\",\"Les joueurs doivent comparer leurs souvenirs et les indices déjà reçus.\",\"Aucun code, coupable ou rituel final n’est établi dans ce test de conversation.\"],limite:\"Ne pas inventer de preuve ni de rôle pour un autre joueur.\"});"}}
workflow['nodes'].extend([model,tool])
workflow['connections']['ChatGPT']={'ai_languageModel':[[{'node':agent['name'],'type':'ai_languageModel','index':0}]]}
workflow['connections'][tool['name']]={'ai_tool':[[{'node':agent['name'],'type':'ai_tool','index':0}]]}
validator=next(n for n in workflow['nodes'] if n['name']=='Valider la reponse de Sally')
validator['parameters']['jsCode']=(ROOT/'valider-agent.js').read_text(encoding='utf-8')
context=next(n for n in workflow['nodes'] if n['name']=='Preparer le contexte de Sally')
original=context['parameters']['jsCode']
start=original.index('const request='); end=original.index('return [{json:',start)
context['parameters']['jsCode']=original[:start]+'const request={instructions,input};\n'+original[end:]
context['parameters']['jsCode']=context['parameters']['jsCode'].replace("Aucun outil ne t'est donné.","Tu disposes uniquement d'un outil de lecture des faits autorisés.")
note=next(n for n in workflow['nodes'] if n['name']=='Configuration du workflow')
note['parameters']['content']='''## Configuration après import
1. Choisir les credentials Telegram dans Reception Telegram et Repondre sur Telegram.
2. ChatGPT : credential OpenAi account repris de votre exemple ; le sélectionner à nouveau si nécessaire.
3. Enregistrer le joueur : jeu_joueurs.
4. Les quatre autres Data Table : jeu_messages.

AI Agent v2.2 + ChatGPT v1.2 comme dans votre exemple. Aucun prompt SEO/Sertek conservé.
Pas de nœud Memory supplémentaire : les 12 derniers échanges viennent des Data Tables.
L’outil connecté ne fait que rappeler les faits de démonstration. Il n’écrit rien.
Session TEST-001 ; David uniquement. Arrêter l’ancien workflow Telegram avant le test.'''
limits=next(n for n in workflow['nodes'] if n['name']=='Limites de cette version')
limits['parameters']['content']+='\nLe format JSON est demandé par consigne puis validé en aval : aucun parser de schéma strict n’est branché à l’agent. Un format invalide entraîne le texte de repli. Le sous-nœud ChatGPT utilise son propre modèle et ses options ; aucun store:false ne lui est transmis par ce workflow.'
target=ROOT.parent/'sally-agent-n8n.json'
target.write_text(json.dumps(workflow,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Variante AI Agent + ChatGPT préparée, sans appel API.')
