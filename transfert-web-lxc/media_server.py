"""Authenticated, persistent audio storage. Run behind an HTTPS reverse proxy."""
import hashlib
import hmac
import json
import os
import re
import sqlite3
import tempfile
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(os.environ.get('MEDIA_ROOT', '/data')).resolve()
TOKEN = os.environ.get('MEDIA_TOKEN', '')
ORIGINS = set(filter(None, os.environ.get('MEDIA_ORIGINS', '').split(',')))
CATALOGUE = Path(os.environ.get('MEDIA_CATALOGUE', '/app/catalogue.json'))
LIMIT = 30 * 1024 * 1024

@contextmanager
def db():
    connection = sqlite3.connect(ROOT / 'catalogue.sqlite')
    connection.row_factory = sqlite3.Row
    try:
        with connection:
            yield connection
    finally:
        connection.close()

def initialize():
    if len(TOKEN) < 32 or not ORIGINS:
        raise RuntimeError('MEDIA_TOKEN (32 caractères minimum) et MEDIA_ORIGINS requis')
    ROOT.mkdir(parents=True, exist_ok=True)
    with db() as connection:
        connection.execute('CREATE TABLE IF NOT EXISTS media (id TEXT, version TEXT, sha256 TEXT, extension TEXT, bytes INTEGER, path TEXT, PRIMARY KEY(id,version))')
        if 'name' not in {row['name'] for row in connection.execute('PRAGMA table_info(media)')}:
            connection.execute('ALTER TABLE media ADD COLUMN name TEXT')
    return {clip['id'] for clip in json.loads(CATALOGUE.read_text(encoding='utf-8'))['clips']}

def valid_audio(extension, head):
    return {'mp3': head.startswith(b'ID3') or (len(head)>1 and head[0]==255 and head[1]&224==224),
            'wav': head.startswith(b'RIFF') and head[8:12]==b'WAVE',
            'ogg': head.startswith(b'OggS'), 'm4a': head[4:8]==b'ftyp'}.get(extension, False)

def valid_image(extension, head):
    return {'png':head.startswith(b'\x89PNG\r\n\x1a\n'),
            'jpg':head.startswith(b'\xff\xd8\xff'), 'jpeg':head.startswith(b'\xff\xd8\xff'),
            'webp':head.startswith(b'RIFF') and head[8:12]==b'WEBP'}.get(extension,False)

class Handler(BaseHTTPRequestHandler):
    # Never log tokens or request paths.
    def log_message(self, *_):
        pass

    def reply(self, code, data=None, payload=None, content_type='application/json'):
        body = payload if payload is not None else json.dumps(data or {}, ensure_ascii=False).encode()
        self.send_response(code)
        origin = self.headers.get('Origin')
        if origin in ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(body)
        self.close_connection = True

    def allowed(self):
        if self.headers.get('Origin') and self.headers['Origin'] not in ORIGINS:
            self.reply(403); return False
        if not hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer '+TOKEN):
            self.reply(401); return False
        return True

    def do_OPTIONS(self):
        if self.headers.get('Origin') not in ORIGINS:
            self.reply(403); return
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
        self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Media-Extension, X-Media-Name')
        self.end_headers()

    def target(self):
        match = re.fullmatch(r'/media/([A-Za-z0-9_-]+)/((?:clean|phone))', self.path)
        return match.groups() if match and (match[1] in IDS or re.fullmatch(r'file-[a-f0-9]{64}',match[1])) else None

    def do_GET(self):
        if not self.allowed(): return
        with db() as connection:
            if self.path == '/media':
                rows = connection.execute('SELECT id,version,sha256,extension,bytes,path,name FROM media ORDER BY id,version').fetchall()
                self.reply(200, {'media': [dict(row) for row in rows]}); return
            target = self.target()
            row = connection.execute('SELECT * FROM media WHERE id=? AND version=?', target).fetchone() if target else None
        if row is None:
            self.reply(404); return
        mime = {'mp3':'audio/mpeg', 'wav':'audio/wav', 'ogg':'audio/ogg', 'm4a':'audio/mp4',
                'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp'}[row['extension']]
        try:
            payload=(ROOT / row['path']).read_bytes()
        except FileNotFoundError:
            self.reply(404, {'error':'File missing'}); return
        self.reply(200, payload=payload, content_type=mime)

    def do_PUT(self):
        if not self.allowed(): return
        target = self.target()
        extension = self.headers.get('X-Media-Extension', '').lower()
        try: size = int(self.headers.get('Content-Length', '0'))
        except ValueError: size = 0
        if not target or extension not in ('mp3','wav','ogg','m4a','png','jpg','jpeg','webp'):
            self.reply(400); return
        image=extension in ('png','jpg','jpeg','webp')
        if image and (not target[0].startswith('file-') or target[1]!='clean'):
            self.reply(400); return
        if not 0 < size <= LIMIT or self.headers.get('Transfer-Encoding'):
            self.reply(413); return
        self.connection.settimeout(60)
        temporary = None
        try:
            hasher = hashlib.sha256()
            remaining = size
            head = b''
            with tempfile.NamedTemporaryFile(dir=ROOT, delete=False) as stream:
                temporary = Path(stream.name)
                while remaining:
                    chunk = self.rfile.read(min(65536, remaining))
                    if not chunk: raise ValueError('Truncated upload')
                    if not head: head = chunk[:16]
                    stream.write(chunk); hasher.update(chunk); remaining -= len(chunk)
                stream.flush(); os.fsync(stream.fileno())
            if not (valid_image(extension,head) if image else valid_audio(extension, head)):
                self.reply(415); return
            sha = hasher.hexdigest()
            if target[0].startswith('file-') and target[0]!='file-'+sha:
                self.reply(400,{'error':'Digest mismatch'}); return
            folder = ROOT / ('images' if image else 'audio') / target[0] / target[1]
            folder.mkdir(parents=True, exist_ok=True)
            path = folder / (sha+'.'+extension)
            os.replace(temporary, path)
            name=unquote(self.headers.get('X-Media-Name','')).replace('\\','/').split('/')[-1][:160]
            with db() as connection:
                connection.execute('INSERT OR REPLACE INTO media(id,version,sha256,extension,bytes,path,name) VALUES (?,?,?,?,?,?,?)',
                                   (*target, sha, extension, size, path.relative_to(ROOT).as_posix(),name))
            self.reply(200, {'id':target[0], 'version':target[1], 'sha256':sha, 'path':path.relative_to(ROOT).as_posix(), 'stored':True})
        except (OSError, ValueError):
            self.reply(500, {'error':'Upload failed'})
        finally:
            if temporary: temporary.unlink(missing_ok=True)

if __name__ == '__main__':
    IDS = initialize()
    ThreadingHTTPServer((os.environ.get('MEDIA_BIND','127.0.0.1'), int(os.environ.get('PORT', '8080'))), Handler).serve_forever()
