'use strict';
// Plateau de jeu de l'iPad : écran simple, sans défilement, avec ambiance sonore et voix de la maison réécoutables.
// Ne reçoit que l'état public de la partie (aucun rôle, camp ni indice). Aucune clé n'est lue ici.
(() => {
 const $ = id => document.getElementById(id);
 const ROMAINS = ['I', 'II', 'III', 'IV', 'V'];
 const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=';
 const SRC_MUSIQUE = 'assets/audio/ambiance.mp3';
 // Textes des voix communes : affichés si le fichier audio manque, et lisibles en silence.
 const TEXTE_ACCUEIL = 'Vous m’entendez ? C’est Sally. Je crois que je suis dans la maison. La même maison. Mais pas tout à fait. Les pièces sont au même endroit, et pourtant rien n’est à sa place. C’est comme un rêve dont je perds les morceaux. Quelque chose est près de moi. Il me fait peur. Il veut ce que cette maison garde fermé. Elle a été construite pour ça, je crois : pour retenir ce qui attend de l’autre côté. Remontez mon chemin. Passez les sceaux. Trouvez la porte qui me ramène, sans lui ouvrir le passage. Et si une voix vous semble familière ce soir… méfiez-vous. Ici, la maison laisse filtrer des visions et des pensées. Tout n’est pas vrai. Écoutez-moi. Écoutez-vous.';
 const TEXTE_ANCIEN = 'Vous m’entendez ? C’est Sally. Je ne sais pas combien de temps ce message restera le même. Je suis encore dans la maison. Mais les pièces ne donnent plus aux mêmes endroits. Vous avez chacun gardé un souvenir de cette nuit. Seul, il ne vous servira à rien. Rassemblez-les. Et si une voix vous demande de choisir à ma place… cherchez d’abord ce qu’elle vous cache.';
 const TEXTE_SCEAU = 'Une nouvelle pièce du dossier est accessible. Laissez chacun la regarder avant de raconter ce qu’elle signifie. Certains détails confirment un souvenir. D’autres ne font que lui ressembler. Vous pouvez encore faire la différence.';
 const SOURCES = {
  accueil: [{src: 'assets/audio/ACCUEIL_SALLY.mp3', texte: TEXTE_ACCUEIL}, {src: 'assets/audio/sally-introduction.mp3', texte: TEXTE_ANCIEN}],
  sceau: [{src: 'assets/audio/COMMUN_SALLY_EVENEMENT_preuve.mp3', texte: TEXTE_SCEAU}]
 };
 const voix = $('pl-audio-voix'), musique = $('pl-audio-musique');
 const etat = {deverrouille: false, ouvert: false, ctx: null, bus: null, code: null, resolues: 0, data: null, affaires: null,
  musiqueVoulue: true, volume: 0.6, voixEnCours: false, courant: null, enAttente: null, jeton: 0, absent: false, texteActuel: ''};
 try { etat.musiqueVoulue = localStorage.getItem('tu-etais-la-musique') !== 'off'; const v = Number(localStorage.getItem('tu-etais-la-volume')); if(v >= 0.1 && v <= 1) etat.volume = v; } catch {}
 const lireSession = cle => { try { return JSON.parse(sessionStorage.getItem(cle) || 'null'); } catch { return null; } };
 const ecrireSession = (cle, valeur) => { try { sessionStorage.setItem(cle, JSON.stringify(valeur)); } catch {} };

 // Messages de la maison déjà diffusés sur cette tablette : toujours l'accueil, puis un message par sceau ouvert.
 function messages(){
  const liste = [{id: 'accueil', titre: 'Le message d’accueil', sources: SOURCES.accueil}];
  for(let n = 1; n <= Math.min(etat.resolues, 5); n++) liste.push({id: 'sceau-' + n, titre: `Le sceau ${ROMAINS[n - 1]} cède`, sources: SOURCES.sceau});
  return liste;
 }
 const messageDe = id => messages().find(m => m.id === id);

 // --- Ambiance : fichier assets/audio/ambiance.mp3 s'il existe, sinon un souffle grave synthétique.
 const drone = {noeuds: null,
  demarrer(){
   if(this.noeuds || !etat.ctx) return;
   const c = etat.ctx, sortie = c.createGain(); sortie.gain.value = 0; sortie.connect(etat.bus);
   const filtre = c.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 380; filtre.Q.value = 2; filtre.connect(sortie);
   const sources = [];
   [[55, 'sine', 0.5], [82.6, 'triangle', 0.22], [110.4, 'sine', 0.1]].forEach(([freq, type, niveau]) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = niveau; o.connect(g); g.connect(filtre); sources.push(o); });
   const lfo = c.createOscillator(), lfoGain = c.createGain(); lfo.frequency.value = 0.07; lfoGain.gain.value = 140; lfo.connect(lfoGain); lfoGain.connect(filtre.frequency); sources.push(lfo);
   const tampon = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), donnees = tampon.getChannelData(0); let lisse = 0;
   for(let i = 0; i < donnees.length; i++){ lisse = (lisse + 0.02 * (Math.random() * 2 - 1)) / 1.02; donnees[i] = lisse * 3.5; }
   const bruit = c.createBufferSource(); bruit.buffer = tampon; bruit.loop = true;
   const bande = c.createBiquadFilter(); bande.type = 'bandpass'; bande.frequency.value = 500; bande.Q.value = 0.6;
   const souffle = c.createGain(); souffle.gain.value = 0.3;
   const lfo2 = c.createOscillator(), lfo2Gain = c.createGain(); lfo2.frequency.value = 0.11; lfo2Gain.gain.value = 0.2; lfo2.connect(lfo2Gain); lfo2Gain.connect(souffle.gain);
   bruit.connect(bande); bande.connect(souffle); souffle.connect(sortie); sources.push(bruit, lfo2);
   sources.forEach(s => s.start());
   sortie.gain.setTargetAtTime(0.55, c.currentTime, 2.5);
   this.noeuds = {sortie, sources};
  },
  arreter(){
   if(!this.noeuds) return;
   const {sortie, sources} = this.noeuds; this.noeuds = null;
   try { sortie.gain.setTargetAtTime(0, etat.ctx.currentTime, 0.5); } catch {}
   setTimeout(() => sources.forEach(s => { try { s.stop(); } catch {} }), 2500);
  }};
 let musiqueActive = false;
 function volumeEffectif(){ return etat.volume * (etat.voixEnCours ? 0.28 : 1); }
 function regler(){
  if(etat.bus && etat.ctx) etat.bus.gain.setTargetAtTime(volumeEffectif(), etat.ctx.currentTime, 0.35);
  else musique.volume = Math.min(1, volumeEffectif());
 }
 function demarrerMusique(){
  if(!etat.deverrouille || !etat.musiqueVoulue || musiqueActive) return;
  musiqueActive = true;
  let repli = false;
  const bascule = () => { if(repli) return; repli = true; drone.demarrer(); };
  musique.onerror = bascule; musique.loop = true; musique.src = SRC_MUSIQUE; regler();
  const p = musique.play(); if(p && p.catch) p.catch(bascule);
 }
 function arreterMusique(){ musiqueActive = false; try { musique.pause(); } catch {} drone.arreter(); }

 // --- Déverrouillage : à appeler pendant un toucher (iPad). Sans lui, aucun son ne peut démarrer.
 function deverrouiller(){
  if(etat.deverrouille) return;
  try {
   const Contexte = window.AudioContext || window.webkitAudioContext;
   if(Contexte){
    etat.ctx = new Contexte(); if(etat.ctx.resume) etat.ctx.resume();
    etat.bus = etat.ctx.createGain(); etat.bus.gain.value = volumeEffectif(); etat.bus.connect(etat.ctx.destination);
    try { etat.ctx.createMediaElementSource(musique).connect(etat.bus); } catch {}
   }
  } catch {}
  for(const a of [voix, musique]){ try { a.muted = true; a.src = SILENCE; const p = a.play(); if(p && p.catch) p.catch(() => {}); a.pause(); a.muted = false; } catch {} }
  etat.deverrouille = true;
  if(etat.ouvert) demarrerMusique();
  rendre();
  if(etat.enAttente){ const id = etat.enAttente; etat.enAttente = null; jouer(id, true); }
 }

 // --- Voix de la maison.
 function marquerJoue(id){ if(!etat.code) return; const cle = 'tu-etais-la-voix-' + etat.code, liste = lireSession(cle) || []; if(!liste.includes(id)){ liste.push(id); ecrireSession(cle, liste); } }
 const dejaJoue = id => (lireSession('tu-etais-la-voix-' + etat.code) || []).includes(id);
 function arreterVoix(){ etat.jeton++; try { voix.pause(); } catch {} etat.voixEnCours = false; regler(); }
 function finVoix(){ etat.voixEnCours = false; regler(); rendre(); }
 function jouer(id, automatique){
  const m = messageDe(id); if(!m) return;
  if(!etat.deverrouille){ etat.enAttente = id; rendre(); return; }
  arreterVoix(); const jeton = ++etat.jeton;
  etat.courant = id; etat.voixEnCours = true; etat.absent = false; marquerJoue(id);
  const essayer = i => {
   const source = m.sources[i];
   if(!source){ if(jeton === etat.jeton){ etat.voixEnCours = false; etat.absent = true; etat.texteActuel = m.sources[0].texte; regler(); rendre(); } return; }
   let echoue = false;
   const echec = () => { if(echoue || jeton !== etat.jeton) return; echoue = true; essayer(i + 1); };
   voix.onerror = echec; voix.onended = () => { if(jeton === etat.jeton) finVoix(); };
   etat.texteActuel = source.texte; voix.src = source.src; regler();
   const p = voix.play(); if(p && p.catch) p.catch(echec);
   rendre();
  };
  essayer(0);
 }

 // --- Rendu.
 function echapper(t){ return String(t).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); }
 function rendre(){
  const ov = $('plateau'); if(!ov) return;
  ov.hidden = !etat.ouvert; document.body.classList.toggle('plateau-ouvert', etat.ouvert);
  if(!etat.ouvert) return;
  const data = etat.data, partie = data?.partie, prog = data?.progression;
  const affaire = etat.affaires?.find(a => a.id === partie?.scenario_id);
  $('pl-titre-affaire').textContent = affaire?.title || 'La maison';
  const image = $('pl-image'), vue = $('pl-vue');
  if(affaire?.image){ if(image.getAttribute('src') !== affaire.image) image.setAttribute('src', affaire.image); vue.hidden = false; $('pl-trace').textContent = affaire.intro || ''; } else vue.hidden = true;
  const actif = prog?.active, resolues = prog?.resolues || 0;
  $('pl-sceau-num').textContent = actif ? `SCEAU ${ROMAINS[actif.etape - 1]} SUR V` : 'LES CINQ SCEAUX SONT OUVERTS';
  $('pl-titre').textContent = actif ? actif.titre : 'Le rituel est prêt.';
  $('pl-enonce').textContent = actif ? enonceCourt(actif.enonce) : 'Il ne reste qu’à choisir la porte.';
  $('pl-sceaux').innerHTML = ROMAINS.map((r, i) => `<li class="${i < resolues ? 'ouvert' : actif && actif.etape === i + 1 ? 'courant' : ''}" aria-label="Sceau ${i + 1}${i < resolues ? ' ouvert' : ''}"><span>${r}</span></li>`).join('');
  $('pl-carnet').hidden = !(prog?.carnet?.length);
  $('pl-carnet-liste').innerHTML = (prog?.carnet || []).map(e => `<li><span>${ROMAINS[e.etape - 1]}</span> ${echapper(e.titre)} <b>${echapper(e.reponse)}</b></li>`).join('');
  $('pl-joueurs').innerHTML = (data?.joueurs || []).map(j => `<li>${echapper(j.prenom)}</li>`).join('');
  // Voix et ambiance.
  const liste = messages(), dernier = messageDe(etat.courant) || liste.at(-1);
  $('pl-etat-voix').textContent = etat.voixEnCours ? 'Sally parle…' : etat.absent ? 'Le fichier audio manque : lisez le texte.' : 'La maison écoute.';
  $('pl-etat-voix').classList.toggle('parle', etat.voixEnCours);
  $('pl-dock-titre').textContent = dernier.titre;
  const bouton = $('pl-rejouer'); bouton.dataset.etat = etat.voixEnCours ? 'lecture' : 'repos';
  bouton.querySelector('.pl-bouton-texte').textContent = etat.voixEnCours ? 'Arrêter la voix' : 'Réécouter';
  bouton.setAttribute('aria-label', etat.voixEnCours ? 'Arrêter la voix' : 'Réécouter : ' + dernier.titre);
  const musiqueBtn = $('pl-musique'); musiqueBtn.setAttribute('aria-pressed', String(etat.musiqueVoulue)); musiqueBtn.querySelector('.pl-bouton-texte').textContent = etat.musiqueVoulue ? 'Ambiance' : 'Ambiance coupée';
  $('pl-volume').value = String(etat.volume);
  $('pl-invite').hidden = etat.deverrouille;
  $('pl-invite-texte').textContent = etat.enAttente ? 'La maison a quelque chose à dire. Touchez pour l’entendre.' : 'Touchez pour réveiller l’ambiance et entendre le message d’accueil.';
  $('pl-transcription').hidden = !(etat.voixEnCours || etat.absent);
  $('pl-transcription-texte').textContent = etat.texteActuel;
  $('pl-feuille-liste').innerHTML = liste.map(m => `<li class="${m.id === etat.courant && etat.voixEnCours ? 'en-lecture' : ''}"><div><strong>${echapper(m.titre)}</strong><p>${echapper(m.sources[0].texte)}</p></div><button type="button" data-message="${m.id}" aria-label="Réécouter : ${echapper(m.titre)}">▶ Réécouter</button></li>`).join('');
 }
 // L'énoncé du serveur commence par le titre de l'affaire et une trace de la nuit : on garde le texte propre au sceau.
 function enonceCourt(texte){ const blocs = String(texte || '').split(/\n\n/); return (blocs.length > 1 ? blocs.slice(1).join('\n\n') : blocs[0]).replace(/\n?Chacun peut me demander[^\n]*$/m, '').trim(); }

 // --- Événements de la partie : accueil au premier affichage, un message à chaque sceau ouvert.
 function evenements(){
  if(!etat.ouvert || !etat.code) return;
  // Premier regard sur cette partie : on note combien de sceaux sont déjà ouverts, sans les annoncer.
  const cleVus = 'tu-etais-la-sceaux-' + etat.code, vus = lireSession(cleVus);
  if(vus === null) ecrireSession(cleVus, etat.resolues);
  if(!dejaJoue('accueil')){ jouer('accueil', true); return; }
  if(vus !== null && etat.resolues > vus){ ecrireSession(cleVus, etat.resolues); jouer('sceau-' + etat.resolues, true); }
 }
 async function chargerAffaires(){ if(etat.affaires) return; try { const r = await fetch('catalogue-affaires.json', {cache: 'no-store'}); etat.affaires = r.ok ? await r.json() : []; } catch { etat.affaires = []; } rendre(); }
 function mettreAJour(data){
  etat.data = data;
  const partie = data?.partie;
  if(!partie || partie.statut !== 'en_cours'){ if(etat.ouvert) fermer(); etat.code = null; return; }
  if(etat.code !== partie.code){ etat.code = partie.code; etat.courant = null; etat.enAttente = null; }
  etat.resolues = data.progression?.resolues || 0;
  rendre(); evenements();
 }
 function ouvrir(){
  if(!etat.data?.partie || etat.data.partie.statut !== 'en_cours') return;
  etat.ouvert = true; chargerAffaires(); rendre(); demarrerMusique(); evenements();
 }
 function fermer(){ etat.ouvert = false; arreterVoix(); arreterMusique(); rendre(); }

 // --- Boutons.
 $('pl-regie').addEventListener('click', fermer);
 $('pl-activer').addEventListener('click', deverrouiller);
 $('pl-rejouer').addEventListener('click', () => { if(etat.voixEnCours){ arreterVoix(); rendre(); } else jouer(etat.courant || 'accueil', false); });
 $('pl-voix').addEventListener('click', () => { const f = $('pl-feuille'); f.hidden = !f.hidden; $('pl-voix').setAttribute('aria-expanded', String(!f.hidden)); });
 $('pl-feuille-fermer').addEventListener('click', () => { $('pl-feuille').hidden = true; $('pl-voix').setAttribute('aria-expanded', 'false'); });
 $('pl-feuille-liste').addEventListener('click', e => { const b = e.target.closest('button[data-message]'); if(b){ deverrouiller(); jouer(b.dataset.message, false); } });
 $('pl-musique').addEventListener('click', () => {
  deverrouiller(); etat.musiqueVoulue = !etat.musiqueVoulue;
  try { localStorage.setItem('tu-etais-la-musique', etat.musiqueVoulue ? 'on' : 'off'); } catch {}
  if(etat.musiqueVoulue) demarrerMusique(); else arreterMusique();
  rendre();
 });
 $('pl-volume').addEventListener('input', e => { etat.volume = Number(e.target.value); try { localStorage.setItem('tu-etais-la-volume', String(etat.volume)); } catch {} regler(); });
 window.Plateau = {deverrouiller, ouvrir, fermer, mettreAJour, jouer,
  etat: () => ({deverrouille: etat.deverrouille, ouvert: etat.ouvert, voixEnCours: etat.voixEnCours, courant: etat.courant, musique: etat.musiqueVoulue, messages: messages().map(m => m.id), absent: etat.absent, enAttente: etat.enAttente})};
})();
