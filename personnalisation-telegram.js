'use strict';
// Même source pour le navigateur et le workflow. Aucune voix synthétique de secours.
const PersonnalisationTelegram=(()=>{
 const voix=['sally','entite'];
 const nettoyer=v=>String(v??'').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu,'').replace(/\s+/g,' ').trim().slice(0,80);
 const cle=v=>nettoyer(v).toLocaleLowerCase('fr');
 function empreinte(v){let h=2166136261;for(const c of v){h^=c.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
 function fichier(prenom,voixDemandee){if(!voix.includes(voixDemandee))throw Error('Voix inconnue');const k=cle(prenom);if(!k)throw Error('Prénom absent');const slug=k.normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32)||'prenom';return voixDemandee.toUpperCase()+'_'+slug+'-'+empreinte(k)+'.mp3';}
 function texte(prenom,voixDemandee){const p=nettoyer(prenom);if(!p)throw Error('Prénom absent');if(voixDemandee==='sally')return `${p}… tu m’entends ? Reste avec moi. J’ai besoin de savoir que tu es toujours là.`;if(voixDemandee==='entite')return `${p}… tu crois être seul à lire ces messages ? Continue. Je t’écoute.`;throw Error('Voix inconnue');}
 function script(prenom,v){return (v==='sally'?'[frightened, shaky voice]\n':'[quietly, cold and menacing]\n')+texte(prenom,v)+'\n';}
 function active(messages){const e=messages.filter(m=>m.sens==='systeme'&&['personnalisation_on','personnalisation_off'].includes(m.type_message)).sort((a,b)=>Number(a.id||0)-Number(b.id||0));return e.at(-1)?.type_message==='personnalisation_on';}
 function decrire(prenom,v,catalogue={}){const p=nettoyer(prenom),nom=fichier(p,v);const disponible=Object.hasOwn(catalogue,nom);return {prenom:p,voix:v,fichier:nom,texte:texte(p,v),script:script(p,v),disponible,audio_url:disponible?'https://thecat78500.github.io/tu-etais-la/assets/audio/personnalisation/'+nom:null};}
 function dejaRecu(messages,joueur,v){return messages.some(m=>m.sens==='sortant'&&m.statut==='envoye'&&String(m.telegram_chat_id)===String(joueur.telegram_chat_id)&&m.contenu===texte(joueur.prenom,v));}
 return {voix,nettoyer,cle,fichier,texte,script,active,decrire,dejaRecu};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PersonnalisationTelegram;
if(typeof window!=='undefined')window.PersonnalisationTelegram=PersonnalisationTelegram;
