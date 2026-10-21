import importlib.util
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

class MediaTests(unittest.TestCase):
    def test_persistence_auth_validation(self):
        with tempfile.TemporaryDirectory() as directory:
            os.environ.update(MEDIA_ROOT=directory, MEDIA_TOKEN='test-token-'*4, MEDIA_ORIGINS='https://game.example', MEDIA_CATALOGUE=str(Path(__file__).parents[1]/'audio-scripts/bibliotheque-v2/catalogue.json'))
            spec=importlib.util.spec_from_file_location('media_server', Path(__file__).with_name('media_server.py'))
            module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
            module.IDS=module.initialize()
            server=module.ThreadingHTTPServer(('127.0.0.1',0),module.Handler)
            threading.Thread(target=server.serve_forever,daemon=True).start()
            base='http://127.0.0.1:'+str(server.server_port)
            def request(path='/media', data=None, token=True, origin='https://game.example', method=None,extension='mp3'):
                headers={'Origin':origin,'X-Media-Extension':extension,'X-Media-Name':'test%20image.png'}
                if token: headers['Authorization']='Bearer '+module.TOKEN
                return urllib.request.urlopen(urllib.request.Request(base+path,data=data,headers=headers,method=method or ('PUT' if data else 'GET')))
            try:
                with self.assertRaises(urllib.error.HTTPError) as error: request(token=False)
                self.assertEqual(error.exception.code,401)
                with self.assertRaises(urllib.error.HTTPError) as error: request(origin='https://other.example')
                self.assertEqual(error.exception.code,403)
                response=request(method='OPTIONS',token=False)
                self.assertEqual(response.headers['Access-Control-Allow-Origin'],'https://game.example')
                target='/media/A01_SALLY_00_introduction/clean'
                with self.assertRaises(urllib.error.HTTPError) as error: request(target,b'not audio')
                self.assertEqual(error.exception.code,415)
                with self.assertRaises(urllib.error.HTTPError) as error: request('/media/unknown/clean',b'ID3hello')
                self.assertEqual(error.exception.code,400)
                audio=(Path(__file__).parents[1]/'assets/audio/sally-introduction.mp3').read_bytes()
                result=json.load(request(target,audio))
                self.assertTrue(result['stored'])
                self.assertEqual(request(target).read(),audio)
                self.assertEqual(len(json.load(request())['media']),1)
                request(target,audio)
                self.assertEqual(len(list(Path(directory).rglob('*.mp3'))),1)
                # A separate process reopens the on-disk catalogue.
                output=subprocess.check_output([sys.executable,'-c',"import sqlite3,sys; print(sqlite3.connect(sys.argv[1]).execute('select count(*) from media').fetchone()[0])",str(Path(directory)/'catalogue.sqlite')])
                self.assertEqual(output.strip(),b'1')
                picture=(Path(__file__).parents[1]/'assets/porte-service.png').read_bytes()
                sha=hashlib.sha256(picture).hexdigest(); image_target='/media/file-'+sha+'/clean'
                image=json.load(request(image_target,picture,extension='png'))
                self.assertTrue(image['stored']); self.assertTrue(image['path'].startswith('images/'))
                self.assertEqual(request(image_target).read(),picture)
                self.assertEqual(request(image_target).headers['Content-Type'],'image/png')
                with self.assertRaises(urllib.error.HTTPError) as error: request('/media/file-'+'0'*64+'/clean',picture,extension='png')
                self.assertEqual(error.exception.code,400)
                with self.assertRaises(urllib.error.HTTPError) as error: request('/media/A01_SALLY_00_introduction/clean',picture[:16],extension='png')
                self.assertEqual(error.exception.code,400)
                records=json.load(request())['media']; self.assertEqual(len(records),2)
                self.assertEqual(next(r for r in records if r['extension']=='png')['name'],'test image.png')
            finally: server.shutdown(); server.server_close()

if __name__=='__main__': unittest.main()
