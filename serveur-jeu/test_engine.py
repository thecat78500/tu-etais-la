import json
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from engine import CAMPS, Engine, FALLBACK
from server import handler

class EngineTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(); self.root=Path(self.temp.name)
        self.time=1000.; self.seq=100
        self.scenarios=json.loads(Path(__file__).with_name('scenarios.json').read_text(encoding='utf-8'))
        self.engine=Engine(self.root/'etat.sqlite',self.scenarios,['1'],clock=lambda:self.time,media_root=self.root/'media')
    def tearDown(self): self.temp.cleanup()
    def update(self,chat,text=None,**extra):
        self.seq+=1
        message={'from':{'id':chat},'chat':{'id':chat,'type':'private'},**extra}
        if text is not None: message['text']=text
        return {'update_id':self.seq,'message':message}
    def say(self,chat,text): return self.engine.receive(self.update(chat,text))
    def create(self,count=4,scenario=1):
        self.say(1,f'/creer {count} {scenario}')
        with self.engine.db() as c: return c.execute('SELECT id FROM sessions ORDER BY created DESC,rowid DESC LIMIT 1').fetchone()[0]
    def start(self,count=4):
        sid=self.create(count)
        for chat in range(2,count+1): self.say(chat,f'/rejoindre {sid} Joueur{chat}')
        self.say(1,'/demarrer'); return sid
    def drain(self):
        collected=[]
        for _ in range(100):
            items=self.engine.claim()['deliveries']
            if not items: return collected
            for item in items:
                collected.append(item)
                self.engine.acknowledge(item['delivery_id'],item['lease'],{'message_id':item['delivery_id'],'chat':{'id':int(item['chat_id'])}})
        self.fail('Queue does not drain')
    def response(self,reply='Je suis encore derrière la porte.',facts=None):
        return {'status':'completed','output':[{'type':'message','content':[{'type':'output_text','text':json.dumps({'reply':reply,'fact_ids':facts or []})}]}],
                'usage':{'input_tokens':10,'output_tokens':10}}
    def test_counts_roles_for_4_to_10(self):
        for count in range(4,11):
            sid=self.start(count)
            with self.engine.db() as c:
                rows=c.execute('SELECT role,camp FROM members WHERE session=?',(sid,)).fetchall()
            g,b,a=CAMPS[count]
            self.assertEqual([sum(r['camp']==name for r in rows) for name in ('gentil','méchant','ambigu')],[g,b,a])
            self.assertLessEqual(a,b); self.assertEqual(len({r['role'] for r in rows}),count)
            self.say(1,'/fin')
    def test_admin_capacity_membership(self):
        self.say(2,'/creer 4')
        with self.engine.db() as c: self.assertEqual(c.execute('SELECT count(*) FROM sessions').fetchone()[0],0)
        sid=self.create(); self.say(1,'/demarrer')
        with self.engine.db() as c: self.assertEqual(c.execute('SELECT state FROM sessions').fetchone()[0],'lobby')
        for chat in range(2,6): self.say(chat,f'/rejoindre {sid} test')
        with self.engine.db() as c: self.assertEqual(c.execute('SELECT count(*) FROM members').fetchone()[0],4)
    def test_update_deduplication(self):
        update=self.update(1,'/creer 4'); self.engine.receive(update); self.engine.receive(update)
        with self.engine.db() as c:
            self.assertEqual(c.execute('SELECT count(*) FROM sessions').fetchone()[0],1)
            self.assertEqual(c.execute('SELECT count(*) FROM outbox').fetchone()[0],1)
    def test_prompt_private_history_and_no_future_truth(self):
        sid=self.start(); self.drain()
        a=self.say(2,'MA QUESTION PRIVÉE JOUEUR DEUX')
        b=self.say(3,'AUTRE QUESTION JOUEUR TROIS')
        prompt=json.dumps(b['request'],ensure_ascii=False)
        self.assertNotIn('MA QUESTION PRIVÉE',prompt)
        self.assertNotIn(self.scenarios[0]['canon'],prompt)
        self.assertNotIn(self.scenarios[0]['success'],prompt)
        self.assertNotIn(self.scenarios[0]['stages'][4],prompt)
        self.assertNotIn('chat_id',prompt)
        self.assertFalse(b['request']['store'])
        self.engine.complete(a['event_id'],self.response()); self.engine.complete(b['event_id'],self.response())
        with self.engine.db() as c: self.assertEqual(c.execute("SELECT count(*) FROM history WHERE session=? AND speaker='assistant' AND text=?",(sid,'Je suis encore derrière la porte.')).fetchone()[0],0)
        self.drain()
        follow=self.say(2,'Tu te souviens ?')
        self.assertIn('MA QUESTION PRIVÉE',json.dumps(follow['request'],ensure_ascii=False))
    def test_completion_invalid_fact_fallback_and_idempotency(self):
        self.start(); self.drain(); event=self.say(2,'Que sais-tu ?')['event_id']
        self.engine.complete(event,self.response('La solution est X',['etape_5']))
        self.assertTrue(self.engine.complete(event,self.response())['duplicate'])
        items=self.engine.claim()['deliveries']; self.assertEqual(len(items),1); self.assertEqual(items[0]['text'],FALLBACK)
    def test_crash_uncertain_and_manual_cancel(self):
        self.say(1,'/aide'); item=self.engine.claim()['deliveries'][0]
        self.assertEqual(self.engine.claim()['deliveries'],[])
        self.time+=181; self.engine.claim()
        with self.engine.db() as c: self.assertEqual(c.execute('SELECT status FROM outbox').fetchone()[0],'uncertain')
        self.assertEqual(self.engine.claim()['deliveries'],[])
        self.engine.resolve(item['delivery_id'],'cancel')
    def test_telegram_ack_429_failure_and_lease(self):
        self.say(1,'/aide'); item=self.engine.claim()['deliveries'][0]
        with self.assertRaises(ValueError): self.engine.acknowledge(item['delivery_id'],'wrong',{})
        result=self.engine.acknowledge(item['delivery_id'],item['lease'],{'ok':False,'error_code':429,'parameters':{'retry_after':20}})
        self.assertEqual(result['status'],'pending'); self.assertEqual(self.engine.claim()['deliveries'],[])
        self.time+=21; item=self.engine.claim()['deliveries'][0]
        result=self.engine.acknowledge(item['delivery_id'],item['lease'],{'ok':False,'error_code':403})
        self.assertEqual(result['status'],'failed')
        self.engine.resolve(item['delivery_id'],'retry'); item=self.engine.claim()['deliveries'][0]
        result=self.engine.acknowledge(item['delivery_id'],item['lease'],{'ok':True,'result':{'message_id':55,'chat':{'id':1},'voice':{'file_id':'telegram-file-id'}}})
        self.assertEqual(result['status'],'sent')
        self.assertTrue(self.engine.acknowledge(item['delivery_id'],item['lease'],{})['duplicate'])
    def test_persistence_backup_restore(self):
        sid=self.start(); self.drain()
        self.engine.backup(self.root/'backup.sqlite')
        restored=Engine(self.root/'backup.sqlite',self.scenarios,['1'])
        with restored.db() as c:
            self.assertEqual(c.execute('SELECT state FROM sessions WHERE id=?',(sid,)).fetchone()[0],'active')
            self.assertEqual(c.execute('SELECT count(*) FROM members').fetchone()[0],4)
            self.assertGreater(c.execute("SELECT count(*) FROM outbox WHERE status='sent'").fetchone()[0],0)
    def test_pause_resume_and_timeout(self):
        sid=self.start(); self.drain()
        event=self.say(2,'Tu es là ?')['event_id']
        self.say(1,'/pause'); self.drain()
        self.engine.complete(event,self.response())
        self.assertEqual(self.engine.claim()['deliveries'],[])
        self.say(1,'/reprendre'); self.drain()
        event=self.say(2,'Une nouvelle question')['event_id']
        self.time+=181; self.engine.claim()
        with self.engine.db() as c: self.assertEqual(c.execute('SELECT status FROM events WHERE id=?',(event,)).fetchone()[0],'ai_timeout')
    def test_new_session_isolation(self):
        old=self.start(); self.drain(); event=self.say(2,'SECRET ANCIENNE PARTIE')['event_id']
        self.engine.complete(event,self.response()); self.drain(); self.say(1,'/fin')
        new=self.start(); self.drain(); result=self.say(2,'Bonjour')
        self.assertNotEqual(old,new); self.assertNotIn('SECRET ANCIENNE PARTIE',json.dumps(result['request']))
    def test_end_cancels_ai_and_pending(self):
        sid=self.start(); self.drain(); event=self.say(2,'Encore une question')['event_id']
        self.say(1,'/fin'); self.engine.complete(event,self.response()); self.time+=500
        messages=self.drain(); self.assertTrue(all(m['chat_id']=='1' for m in messages))
    def test_no_concurrent_claim(self):
        self.say(1,'/aide'); output=[]
        threads=[threading.Thread(target=lambda:output.extend(self.engine.claim()['deliveries'])) for _ in range(6)]
        for t in threads:t.start()
        for t in threads:t.join()
        self.assertEqual(len(output),1)
    def test_incoming_photo_and_voice_command(self):
        sid=self.start(); self.drain()
        self.engine.receive(self.update(2,photo=[{'file_id':'small'},{'file_id':'large'}]))
        with self.engine.db() as c: self.assertEqual(c.execute('SELECT photo_file_id FROM members WHERE session=? AND chat=?',(sid,'2')).fetchone()[0],'large')
        folder=self.root/'media/audio'; folder.mkdir(parents=True); (folder/'sally-introduction.mp3').write_bytes(b'ID3test')
        self.drain(); self.say(2,'/vocal'); items=self.engine.claim()['deliveries']
        self.assertTrue(any(i['kind']=='voice' for i in items))
    def test_unsolicited_messages_once_and_budget(self):
        sid=self.start(); self.drain(); self.time+=241
        first=self.drain()
        self.assertEqual(len(first),4)
        self.assertEqual(self.drain(),[])
        event=self.say(2,'Une question'); self.assertTrue(event['needs_ai'])
        self.assertFalse(self.say(2,'Trop vite')['needs_ai'])
    def test_internal_http_auth(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),handler(self.engine,'a'*40))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        base='http://127.0.0.1:'+str(server.server_port)
        try:
            with self.assertRaises(urllib.error.HTTPError) as error: urllib.request.urlopen(base+'/health')
            self.assertEqual(error.exception.code,401)
            request=urllib.request.Request(base+'/health',headers={'Authorization':'Bearer '+'a'*40})
            self.assertTrue(json.load(urllib.request.urlopen(request))['ok'])
            request=urllib.request.Request(base+'/telegram',data=json.dumps(self.update(1,'/aide')).encode(),headers={'Authorization':'Bearer '+'a'*40})
            self.assertFalse(json.load(urllib.request.urlopen(request))['needs_ai'])
        finally: server.shutdown(); server.server_close()

if __name__=='__main__': unittest.main(verbosity=2)
