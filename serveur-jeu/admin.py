"""Outils locaux d'administration. La commande history affiche des conversations privées."""
import argparse
import json
from server import configured_engine

parser=argparse.ArgumentParser()
parser.add_argument('action',choices=['status','history','cancel','retry','backup'])
parser.add_argument('value',nargs='?')
parser.add_argument('--confirm',action='store_true',help='Accepter explicitement le risque de doublon pour retry')
args=parser.parse_args(); engine=configured_engine()
if args.action=='status':
    with engine.db() as c:
        sessions=[dict(r) for r in c.execute('SELECT id,expected,scenario,state,stage FROM sessions ORDER BY created DESC LIMIT 20')]
        outbox=[dict(r) for r in c.execute("SELECT id,session,kind,status,attempts,last_error FROM outbox WHERE status IN ('failed','uncertain') ORDER BY id")]
    print(json.dumps({'parties':sessions,'envois_a_verifier':outbox},ensure_ascii=False,indent=2))
elif args.action=='history':
    if not args.value: parser.error('Code de partie requis')
    with engine.db() as c:
        rows=[dict(r) for r in c.execute('SELECT chat,speaker,text,created FROM history WHERE session=? ORDER BY id',(args.value.upper(),))]
        deliveries=[dict(r) for r in c.execute('SELECT id,chat,kind,text,status,telegram_id,created FROM outbox WHERE session=? ORDER BY id',(args.value.upper(),))]
    print(json.dumps({'conversations':rows,'envois':deliveries},ensure_ascii=False,indent=2))
elif args.action=='backup':
    if not args.value: parser.error('Chemin de sauvegarde requis')
    engine.backup(args.value); print('Sauvegarde terminée.')
else:
    if not args.value or not args.value.isdigit(): parser.error('Identifiant numérique de l’envoi requis')
    if args.action=='retry' and not args.confirm: parser.error('Vérifier Telegram, puis ajouter --confirm : risque de doublon')
    print(json.dumps(engine.resolve(int(args.value),args.action)))
