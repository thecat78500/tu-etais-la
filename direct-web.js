'use strict';
// Une connexion d'événements, sans interrogation répétée de n8n.
(()=>{class LiaisonDirecte{
 constructor({change,pret,statut}){Object.assign(this,{change,pret,statut});this.generation=0;this.tentative=0;}
 abonner(url,cle){if(this.url===url&&this.cle===cle)return;this.arreter();this.url=url;this.cle=cle;this.connecter(this.generation);}
 arreter(){this.generation++;clearTimeout(this.attente);this.controle?.abort();this.url=null;this.cle=null;this.tentative=0;this.dejaConnecte=false;}
 async connecter(g){
  if(g!==this.generation||!this.url)return;this.controle=new AbortController();
  try{
   const r=await fetch(this.url,{headers:{Authorization:'Bearer '+this.cle},signal:this.controle.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
   if(!r.ok||!r.headers.get('content-type')?.includes('text/event-stream'))throw Error('Liaison indisponible');
   const lecteur=r.body.getReader(),decoder=new TextDecoder();let tampon='';
   while(g===this.generation){const {value,done}=await lecteur.read();if(done)throw Error('Liaison interrompue');tampon+=decoder.decode(value,{stream:true});if(tampon.length>65536)throw Error('Message trop volumineux');let n;
    while((n=tampon.indexOf('\n\n'))>=0){const bloc=tampon.slice(0,n);tampon=tampon.slice(n+2);const type=bloc.split('\n').find(l=>l.startsWith('event:'))?.slice(6).trim(),texte=bloc.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('\n');if(!texte)continue;let b;try{b=JSON.parse(texte);}catch{continue;}
     if(type==='ready'){const reprise=this.dejaConnecte;this.dejaConnecte=true;this.tentative=0;this.statut?.('Liaison en direct');this.pret?.(b,reprise);}else if(type==='change')this.change?.(b);
    }
   }
  }catch(e){if(g!==this.generation||e.name==='AbortError')return;this.statut?.('Liaison interrompue · reconnexion…');const ms=Math.min(30000,1000*2**Math.min(5,this.tentative++));this.attente=setTimeout(()=>this.connecter(g),ms);}
 }
}window.LiaisonDirecte=LiaisonDirecte;})();
