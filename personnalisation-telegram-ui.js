'use strict';
(()=>{
 const P=window.PersonnalisationTelegram;
 let catalogue={},revision=0,signature='',dernierEtat=null;
 const $=id=>document.getElementById(id);
 function telecharger(nom,contenu){const url=URL.createObjectURL(new Blob([contenu],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=nom;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function rendre(etat){dernierEtat=etat;const zone=$('personnalisation-telegram');if(!zone)return;zone.hidden=!etat.autorise||!etat.partie;if(zone.hidden){zone.querySelectorAll('audio').forEach(a=>a.pause());signature='';$('perso-joueurs').replaceChildren();return;}
 const bouton=$('perso-activer');bouton.disabled=!etat.disponible||etat.busy; bouton.textContent=etat.active===null?'Actualiser pour connaître l’état':etat.active?'Désactiver la personnalisation':'Activer la personnalisation';bouton.setAttribute('aria-pressed',String(etat.active===true));bouton.onclick=()=>etat.changer?.();
 if(etat.partie?.statut!=='en_cours')bouton.textContent='Disponible après le lancement';
 $('perso-etat').textContent=etat.partie?.statut!=='en_cours'?'Tu peux préparer les textes pendant les inscriptions. L’activation sera disponible après le lancement.':etat.active===null?'Le serveur n’a pas encore confirmé l’état.':etat.active?'Activée pour cette partie. Les interventions arrivent au rythme habituel des messages.':'Désactivée pour cette partie. Prépare les voix avant de l’activer.';
 const uniques=[...new Map((etat.joueurs||[]).map(j=>[P.cle(j.prenom),P.nettoyer(j.prenom)])).values()].filter(Boolean);
 const nouvelle=JSON.stringify([uniques,revision]);if(nouvelle===signature)return;signature=nouvelle;zone.querySelectorAll('audio').forEach(a=>a.pause());$('perso-joueurs').replaceChildren();
 if(!uniques.length){$('perso-joueurs').textContent='Les prénoms apparaîtront ici après les inscriptions.';return;}
 for(const prenom of uniques){const article=document.createElement('article'),h=document.createElement('h4');h.textContent=prenom;article.append(h);
 for(const v of P.voix){const d=P.decrire(prenom,v,catalogue),bloc=document.createElement('div'),titre=document.createElement('strong'),statut=document.createElement('span'),phrase=document.createElement('p'),nom=document.createElement('code'),b=document.createElement('button');titre.textContent=v==='sally'?'Sally':'L’entité';statut.textContent=d.disponible?'Vocal disponible':'À enregistrer · texte seulement';statut.className=d.disponible?'perso-pret':'perso-manquant';phrase.textContent=d.texte;nom.textContent=d.fichier;b.type='button';b.textContent='Télécharger le texte pour ElevenLabs';b.onclick=()=>telecharger(d.fichier.replace(/\.mp3$/,'.txt'),d.script);bloc.append(titre,statut,phrase,nom,b);
 if(d.disponible){const a=document.createElement('audio');a.controls=true;a.preload='none';a.src=d.audio_url;a.setAttribute('aria-label','Écouter '+titre.textContent+' pour '+prenom);a.addEventListener('play',()=>zone.querySelectorAll('audio').forEach(x=>{if(x!==a)x.pause()}));bloc.append(a);}
 article.append(bloc);} $('perso-joueurs').append(article);}
 }
 window.PersonnalisationTelegramUI={mettreAJour:rendre};
 fetch('assets/audio/personnalisation/catalogue.json',{cache:'no-store',credentials:'omit'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(c=>{if(c.version!==1||!c.audios||Array.isArray(c.audios))throw Error();catalogue=c.audios;revision++;if(dernierEtat)rendre(dernierEtat);}).catch(()=>{const n=$('perso-catalogue-erreur');if(n)n.textContent='Le catalogue des voix est indisponible. Les textes restent accessibles ; réactualise avant d’évaluer les fichiers manquants.';});
})();
