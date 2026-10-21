"""API interne de n8n, liée à 127.0.0.1 uniquement. Python >= 3.9."""
import argparse
import hmac
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from engine import Engine

BASE=Path(__file__).resolve().parent

def configured_engine():
    return Engine(os.environ.get('GAME_DB','/srv/tu-etais-la/etat/jeu.sqlite3'),
                  json.loads((BASE/'scenarios.json').read_text(encoding='utf-8')),
                  os.environ.get('GAME_ADMIN_IDS','6644853325').split(','),
                  os.environ.get('GAME_AI_MODEL','gpt-4.1-mini'),
                  os.environ.get('GAME_MEDIA_ROOT','/srv/tu-etais-la/media'))

def handler(engine,token):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*_): pass # no player text, credentials or request bodies in logs
        def reply(self,code,data):
            body=json.dumps(data,ensure_ascii=False).encode()
            self.send_response(code); self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Content-Length',str(len(body))); self.send_header('Cache-Control','no-store')
            self.send_header('Connection','close'); self.end_headers(); self.wfile.write(body); self.close_connection=True
        def authorized(self):
            if not hmac.compare_digest(self.headers.get('Authorization',''),'Bearer '+token):
                self.reply(401,{'error':'Unauthorized'}); return False
            return True
        def do_GET(self):
            if not self.authorized(): return
            if self.path=='/health': self.reply(200,{'ok':True,'schema':1}); return
            if self.path=='/admin/outbox':
                with engine.db() as c:
                    rows=c.execute("SELECT id,session,chat,status,kind,attempts,last_error FROM outbox WHERE status IN ('failed','uncertain') ORDER BY id DESC LIMIT 100").fetchall()
                self.reply(200,{'deliveries':[dict(r) for r in rows]}); return
            self.reply(404,{'error':'Not found'})
        def do_POST(self):
            if not self.authorized(): return
            try:
                size=int(self.headers.get('Content-Length','0'))
                if not 0<size<=262144 or self.headers.get('Transfer-Encoding'):
                    self.reply(413,{'error':'Invalid request size'}); return
                self.connection.settimeout(15)
                payload=json.loads(self.rfile.read(size))
                if not isinstance(payload,dict): raise ValueError()
                if self.path=='/telegram': result=engine.receive(payload)
                elif self.path=='/ai/complete':
                    response=payload.get('response',{})
                    if not isinstance(response,dict): response={}
                    result=engine.complete(int(payload['event_id']),response)
                elif self.path=='/outbox/claim': result=engine.claim()
                elif self.path=='/outbox/ack':
                    response=payload.get('result',{})
                    if not isinstance(response,dict): response={}
                    result=engine.acknowledge(int(payload['delivery_id']),str(payload['lease']),response)
                elif self.path=='/admin/resolve': result=engine.resolve(int(payload['delivery_id']),payload['action'])
                else: self.reply(404,{'error':'Not found'}); return
                self.reply(200,result)
            except (ValueError,KeyError,TypeError,json.JSONDecodeError): self.reply(400,{'error':'Invalid request'})
            except Exception:
                # Avoid leaking conversation text, filesystem details or secrets to n8n errors.
                self.reply(500,{'error':'Internal error; transaction rolled back'})
    return Handler

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--backup'); args=parser.parse_args()
    engine=configured_engine()
    if args.backup:
        engine.backup(args.backup)
        print('Sauvegarde SQLite terminée.')
    else:
        token=os.environ.get('GAME_API_TOKEN','')
        if len(token)<32: raise SystemExit('GAME_API_TOKEN requis (32 caractères minimum)')
        service=ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('GAME_PORT','8790'))),handler(engine,token))
        print('Mémoire du jeu prête sur 127.0.0.1.',flush=True)
        service.serve_forever()
