'use strict';
// Relais événementiel : uniquement code de partie, empreinte de clé, révision et échéance.
// Aucun camp, indice, nom de joueur ou message n'est accepté dans l'état persistant.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const empreinte=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
function creerRelais(config){
 if(!/^[a-f0-9]{64}$/.test(config.secret||''))throw Error('Clé interne requise.');
 const fichier=config.fichier,parties=new Map(),clients=new Map(),timers=new Map(),tentatives=new Map();
 const maintenant=config.maintenant||Date.now,delai=config.delai||90000,origines=config.origines||['https://thecat78500.github.io'];
 const autorise=req=>{const a=Buffer.from(req.headers.authorization||''),b=Buffer.from('Bearer '+config.secret);return a.length===b.length&&crypto.timingSafeEqual(a,b);};
 const sauver=()=>{if(!fichier)return;fs.mkdirSync(path.dirname(fichier),{recursive:true,mode:0o700});fs.writeFileSync(fichier+'.tmp',JSON.stringify([...parties.values()]),{mode:0o600});fs.renameSync(fichier+'.tmp',fichier);};
 if(fichier&&fs.existsSync(fichier))for(const p of JSON.parse(fs.readFileSync(fichier)))if(p.code&&p.cleHash)parties.set(p.code,p);
 const envoyer=(res,event,data)=>res.write('event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n');
 function diffuser(p){for(const res of clients.get(p.code)||[])envoyer(res,'change',{revision:p.revision});}
 function programmer(p){
  clearTimeout(timers.get(p.code));timers.delete(p.code);
  if(!p.eligible||!clients.get(p.code)?.size)return;
  const echeance=Math.max(maintenant()+1000,p.dernierVocal+delai);
  const t=setTimeout(async()=>{
   timers.delete(p.code);const actuel=parties.get(p.code);if(!actuel?.eligible||!clients.get(p.code)?.size)return;
   try{await config.murmure(p.code); // Le workflow republie sa directive, même s'il n'envoie rien.
    if(!timers.has(p.code)&&parties.get(p.code)?.eligible){actuel.dernierVocal=maintenant();sauver();programmer(actuel);}
   }catch{if(parties.get(p.code)?.eligible){actuel.dernierVocal=maintenant()-delai+15000;sauver();programmer(actuel);}}
  },Math.min(2147483647,Math.max(0,echeance-maintenant())));
  t.unref?.();timers.set(p.code,t);
 }
 function publier(b){
  if(!/^M[A-Z0-9]{7}$/.test(b.code)||!/^[a-f0-9]{64}$/.test(b.cle||'')||!Number.isSafeInteger(b.revision)||b.revision<0)throw Error('Directive invalide');
  const avant=parties.get(b.code);if(avant&&avant.revision>b.revision)return false;
  const p={code:b.code,cleHash:empreinte(b.cle),revision:b.revision,eligible:b.eligible===true,dernierVocal:Math.min(maintenant(),Number(b.dernierVocal)||maintenant()),maj:maintenant()};
  parties.set(p.code,p);sauver();programmer(p);if(!avant||avant.revision!==p.revision)diffuser(p);return true;
 }
 const json=(res,status,b)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(b));};
 const lire=async req=>{let t='';for await(const c of req){t+=c;if(t.length>4096)throw Error('Directive trop volumineuse');}return JSON.parse(t);};
 const serveur=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;if(origin&&!origines.includes(origin))return json(res,403,{ok:false});
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','authorization,content-type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  try{
   const u=new URL(req.url,'http://local'),route=u.pathname.replace(/^\/jeu-direct/,'');
   if(route==='/health'&&req.method==='GET')return json(res,200,{ok:true});
   if(route==='/publier'&&req.method==='POST'){if(!autorise(req))return json(res,401,{ok:false});publier(await lire(req));return json(res,200,{ok:true});}
   const m=route.match(/^\/events\/(M[A-Z0-9]{7})$/);
   if(m&&req.method==='GET'){
    const cle=(req.headers.authorization||'').replace(/^Bearer /,''),code=m[1];
    if(!/^[a-f0-9]{64}$/.test(cle))return json(res,401,{ok:false});
    let p=parties.get(code);
    if(!p||p.cleHash!==empreinte(cle)){
     const ip=req.socket.remoteAddress,t=tentatives.get(ip)||{n:0,depuis:maintenant()};if(maintenant()-t.depuis>60000){t.n=0;t.depuis=maintenant();}if(++t.n>10)return json(res,429,{ok:false});if(tentatives.size>2000)tentatives.clear();tentatives.set(ip,t);
     const v=await config.valider(code,cle);if(!v)return json(res,401,{ok:false});
     p=p||{code,cleHash:empreinte(cle),revision:v.revision,eligible:false,dernierVocal:maintenant(),maj:maintenant()};
     if(p.cleHash!==empreinte(cle))return json(res,401,{ok:false});parties.set(code,p);sauver();
    }
    const ensemble=clients.get(code)||new Set();if(ensemble.size>=20)return json(res,429,{ok:false});clients.set(code,ensemble);ensemble.add(res);
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();envoyer(res,'ready',{revision:p.revision});
    programmer(p);const battement=setInterval(()=>res.write(': liaison\n\n'),20000);battement.unref?.();res.on('close',()=>{clearInterval(battement);ensemble.delete(res);if(!ensemble.size){clients.delete(code);clearTimeout(timers.get(code));timers.delete(code);}});return;
   }
   return json(res,404,{ok:false});
  }catch{return json(res,400,{ok:false});}
 });
 const fermer=async()=>{for(const t of timers.values())clearTimeout(t);for(const s of clients.values())for(const r of s)r.end();serveur.closeAllConnections?.();await new Promise(ok=>serveur.close(ok));};
 for(const p of parties.values())programmer(p);
 return {serveur,fermer,publier,compterTimers:()=>timers.size};
}
if(require.main===module){
 const secret=process.env.JEU_DIRECT_SECRET,n8n=process.env.N8N_URL||'http://127.0.0.1:5678';
 const relais=creerRelais({secret,fichier:process.env.JEU_DIRECT_ETAT||'/var/lib/tu-etais-la-direct/etat.json',
  valider:async(code,cle)=>{const r=await fetch(n8n+'/webhook/tu-etais-la/ecran',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({partie:code,cle}),signal:AbortSignal.timeout(15000)});if(!r.ok)return null;const b=await r.json();return b.ok?{revision:b.jeu.revision}:null;},
  murmure:async code=>{const r=await fetch(n8n+'/webhook/tu-etais-la/murmure-programme',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret},body:JSON.stringify({partie:code}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Murmure différé');}
 });relais.serveur.listen(Number(process.env.PORT||8790),process.env.HOST||'0.0.0.0',()=>console.log('Relais du jeu prêt.'));
 process.on('SIGTERM',()=>relais.fermer().then(()=>process.exit(0)));
}
module.exports={creerRelais};
