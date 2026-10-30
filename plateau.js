'use strict';
// Plateau de jeu de l'iPad : écran simple, sans défilement, avec ambiance sonore et voix de la maison réécoutables.
// État public uniquement ; rôles et camps arrivent après la révélation finale. Aucun indice privé ni clé.
(() => {
 const $ = id => document.getElementById(id);
 const ROMAINS = ['I', 'II', 'III', 'IV', 'V'];
 const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=';
 const SRC_MUSIQUE = ['assets/audio/ambiance.mp3', 'assets/audio/ambiance.wav'];
 // Textes des voix communes : affichés si le fichier audio manque, et lisibles en silence.
 const TEXTE_ACCUEIL = 'Vous m’entendez ? C’est Sally. Je crois que je suis dans la maison. La même maison. Mais pas tout à fait. Les pièces sont au même endroit, et pourtant rien n’est à sa place. C’est comme un rêve dont je perds les morceaux. Quelque chose est près de moi. Il me fait peur. Il veut ce que cette maison garde fermé. Elle a été construite pour ça, je crois : pour retenir ce qui attend de l’autre côté. Remontez mon chemin. Passez les sceaux. Trouvez la porte qui me ramène, sans lui ouvrir le passage. Et si une voix vous semble familière ce soir… méfiez-vous. Ici, la maison laisse filtrer des visions et des pensées. Tout n’est pas vrai. Écoutez-moi. Écoutez-vous.';
 const TEXTE_ANCIEN = 'Vous m’entendez ? C’est Sally. Je ne sais pas combien de temps ce message restera le même. Je suis encore dans la maison. Mais les pièces ne donnent plus aux mêmes endroits. Vous avez chacun gardé un souvenir de cette nuit. Seul, il ne vous servira à rien. Rassemblez-les. Et si une voix vous demande de choisir à ma place… cherchez d’abord ce qu’elle vous cache.';
 const TEXTE_SCEAU = 'Une nouvelle pièce du dossier est accessible. Laissez chacun la regarder avant de raconter ce qu’elle signifie. Certains détails confirment un souvenir. D’autres ne font que lui ressembler. Vous pouvez encore faire la différence.';
 const SOURCES = {
  accueil: [{src: 'assets/audio/ACCUEIL_SALLY.mp3', texte: TEXTE_ACCUEIL}, {src: 'assets/audio/ACCUEIL_SALLY.wav', texte: TEXTE_ACCUEIL}, {src: 'assets/audio/sally-introduction.mp3', texte: TEXTE_ANCIEN}, {src: 'assets/audio/sally-introduction.MP3', texte: TEXTE_ANCIEN}],
  sceau: [{src: 'assets/audio/COMMUN_SALLY_EVENEMENT_preuve.mp3', texte: TEXTE_SCEAU}, {src: 'assets/audio/COMMUN_SALLY_EVENEMENT_preuve.wav', texte: TEXTE_SCEAU}]
 };
 const voix = $('pl-audio-voix'), musique = $('pl-audio-musique');
 const etat = {deverrouille: false, ouvert: false, ctx: null, bus: null, code: null, resolues: 0, data: null, affaires: null,
  musiqueVoulue: true, volume: 0.6, voixEnCours: false, courant: null, enAttente: null, jeton: 0, absent: false, texteActuel: '',
  appel: null, sonnerie: false, delaiSonnerie: 40000, minuterie: null, chrono: null, manques: [],
  musiqueNiveau: 0.5, effetEnCours: 0, jetonEffet: 0,
  annonces: [], fileAnnonces: [], annonceCourante: null, minuterieAnnonce: null, sondePouvoirs: null};
 try {
  etat.musiqueVoulue = localStorage.getItem('tu-etais-la-musique') !== 'off';
  const v = Number(localStorage.getItem('tu-etais-la-volume')); if(v >= 0.1 && v <= 1) etat.volume = v;
  const m = Number(localStorage.getItem('tu-etais-la-musique-niveau')); if(m >= 0.05 && m <= 1) etat.musiqueNiveau = m;
 } catch {}
 const lireSession = cle => { try { return JSON.parse(sessionStorage.getItem(cle) || 'null'); } catch { return null; } };
 const ecrireSession = (cle, valeur) => { try { sessionStorage.setItem(cle, JSON.stringify(valeur)); } catch {} };

 // Messages de la maison déjà diffusés sur cette tablette : toujours l'accueil, puis un message par sceau ouvert.
 const CONCLUSIONS={
  1:{appelant:'sally',titre:'Sally — Dehors, enfin',texte:'Vous m’entendez ? C’est moi… Sally. Je suis dehors ! Il y a de l’air, de la lumière… Oh, vous avez réussi ! J’avais tellement peur de ne plus jamais sortir. La maison est derrière moi. Lui, il est resté à l’intérieur. Je ne sais même pas quoi vous dire… Merci. Merci d’avoir continué à me chercher, d’avoir tenu bon. Je suis là. Je suis vraiment là… Je suis tellement heureuse !'},
  2:{appelant:'entite',titre:'L’entité — Le passage',texte:'Ne cherchez plus Sally dans ce téléphone. Écoutez plutôt le silence autour de vous. Il a changé, n’est-ce pas ? Il a suffi d’une porte. Vous avez discuté, douté, choisi… et vous m’avez laissé passer. Certains d’entre vous m’attendaient. Ils ont bien joué. La maison est derrière moi, maintenant. Et vous êtes de ce côté-ci.'},
  3:{appelant:'sally',titre:'Sally — Derrière le verrou',texte:'Le bruit s’est arrêté. La porte tient. Il est enfermé avec moi, mais il ne peut plus vous atteindre. Vous avez fermé le passage… et je suis restée du mauvais côté. Ne rouvrez pas pour me chercher. Gardez au moins ce que vous avez sauvé. Si ma voix vous appelle encore après celle-ci, prenez le temps d’écouter. Ce ne sera peut-être plus moi.'},
  4:{appelant:'entite',titre:'L’entité — Vous restez',texte:'Vous avez entendu le verrou ? Ce n’était pas une porte qui s’ouvrait. C’était la dernière qui se fermait. Sally est ici. Vous aussi. Plus besoin de chercher comment sortir : la maison vous a gardés. Ceux qui m’ont servi ont obtenu ce qu’ils voulaient. Regardez bien les visages autour de la table. Nous avons tout le temps de faire connaissance.'},
  5:{appelant:'sally',titre:'Sally — La ligne s’efface',texte:'Je vous entends de moins en moins. La porte a disparu avant que je puisse l’atteindre. Je suis toujours ici. La maison n’a rien rendu, rien laissé passer. Pour vous, cette nuit va finir. Pour moi, elle recommence. Si quelqu’un revient un jour, dites-lui que j’étais là. Que j’ai appelé. Et que j’attends encore.'}
 };
 const IDENTITES_APPEL={sally:{nom:'Sally',visage:'S',label:'Appel de Sally'},entite:{nom:'L’entité',visage:'◉',label:'Appel de l’entité'}};
 const identiteAppel=m=>IDENTITES_APPEL[m?.appelant]||IDENTITES_APPEL.sally;
 function conclusion(){const p=etat.data?.progression?.portes;return p?.phase==='fin'&&CONCLUSIONS[p.resultat?.issue]?{id:'conclusion-'+p.resultat.issue,...CONCLUSIONS[p.resultat.issue],issue:p.resultat.issue}:null}
 function messages(){
  const liste = [{id: 'accueil', titre: 'Le message d’accueil', sources: SOURCES.accueil}];
  const fin=conclusion();
  for(let n = 1; n <= Math.min(etat.resolues, fin?4:5); n++)liste.push({id:'sceau-'+n,titre:`Le sceau ${ROMAINS[n-1]} cède`,sources:SOURCES.sceau});
  if(fin)liste.push({...fin,sources:['wav','mp3','MP3'].map(ext=>({src:`assets/audio/fin-porte-${fin.issue}.${ext}`,texte:fin.texte}))});
  return liste;
 }
 const messageDe = id => messages().find(m => m.id === id);

 // Chaque issue a son atmosphère ; les gagnants viennent uniquement de la révélation du moteur.
 const FINS_VISUELLES={
  1:{theme:'aube',signe:'Sally est revenue',texte:'Une lumière traverse enfin le seuil. La maison peut vous laisser partir.'},
  2:{theme:'entite',signe:'Elle est de votre côté du seuil',texte:'Le passage est ouvert. Ce qui attendait derrière la porte est maintenant avec vous.'},
  3:{theme:'scellee',signe:'Le dernier verrou tient',texte:'La maison retient l’entité. De l’autre côté, Sally attend encore.'},
  4:{theme:'piege',signe:'La maison vous garde',texte:'Le verrou se referme derrière vous. Sally, l’entité et vous : plus personne ne sort.'},
  5:{theme:'immobile',signe:'Le silence reprend sa place',texte:'Le seuil s’efface. Sally reste loin, et la maison attendra d’autres pas.'}
 };
 function rendreFin(portes){
  const fin=portes?.phase==='fin'&&portes.resultat;
  $('pl-fin-scene').hidden=!fin;
  if(!fin){delete $('plateau').dataset.issue;delete $('plateau').dataset.fin;return}
  const visuel=FINS_VISUELLES[fin.issue]||FINS_VISUELLES[5];
  $('plateau').dataset.issue=String(fin.issue);$('plateau').dataset.fin=visuel.theme;
  $('pl-fin-presage').textContent=visuel.signe;
  $('pl-fin-recit').textContent=visuel.texte;
  const src='assets/portes/porte-'+encodeURIComponent(fin.porte.toLowerCase())+'.png';
  if($('pl-fin-porte').getAttribute('src')!==src)$('pl-fin-porte').setAttribute('src',src);
  const revelation=Array.isArray(portes.revelation)?portes.revelation:[];
  const gagnants=revelation.filter(j=>j.victoire===true);
  const gentils=gagnants.filter(j=>j.camp==='gentil'),mechants=gagnants.filter(j=>j.camp==='mechant'),ambigus=gagnants.filter(j=>j.camp==='ambigu');
  const victoires=[];if(gentils.length)victoires.push('des gentils');if(mechants.length)victoires.push('de l’entité');
  if(ambigus.length)victoires.push('de '+ambigus.map(j=>j.prenom).join(' et '));
  $('pl-fin-victoire').textContent=victoires.length?'Victoire '+victoires.join(' et '):revelation.length?'Aucun vainqueur':'Révélation des camps';
  const noms=[];
  if(gentils.length)noms.push('Gentils : '+gentils.map(j=>j.prenom).join(', '));
  if(mechants.length)noms.push('Camp de l’entité : '+mechants.map(j=>j.prenom).join(', '));
  if(ambigus.length)noms.push('Objectif personnel atteint : '+ambigus.map(j=>j.prenom+' (porte '+j.objectif+')').join(', '));
  $('pl-fin-gagnants').textContent=noms.length?noms.join(' · '):revelation.length?'Aucun camp ni objectif personnel ne remporte cette partie.':'Les rôles et les objectifs sont révélés ci-dessous.';
  $('pl-fin-appel').textContent=conclusion()?.appelant==='entite'?'Rappeler l’entité':'Rappeler Sally';
 }

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
 // --- Bruits de la maison : un son bref de temps en temps, plus rapproché et plus sombre quand le jeu avance.
 // Chaque bruit existe en version fabriquée par le navigateur ; un fichier assets/audio/effets/<nom>.mp3 le remplace s'il existe.
 const EFFETS = ['craquement', 'coups', 'pas', 'vent', 'murmure', 'horloge', 'porte', 'cloche'];
 const bruit = {tampon: null, sortie: null, buffers: {}, joues: [], minuterie: null, dernier: null,
  delais: {debut: [35000, 75000], milieu: [25000, 55000], fin: [15000, 40000]}};
 function tamponBruit(){
  if(bruit.tampon) return bruit.tampon;
  const c = etat.ctx, n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return bruit.tampon = b;
 }
 function sortieEffets(){
  if(!bruit.sortie){ bruit.sortie = etat.ctx.createGain(); bruit.sortie.connect(etat.ctx.destination); }
  bruit.sortie.gain.value = etat.volume; return bruit.sortie;
 }
 const enveloppe = (g, t, attaque, duree, niveau) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(niveau, t + attaque); g.gain.exponentialRampToValueAtTime(0.0001, t + duree); };
 function coup(t, freq, niveau, duree = 0.28){
  const c = etat.ctx, s = sortieEffets(), o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.45, t + duree); o.connect(g); g.connect(s); enveloppe(g, t, 0.008, duree, niveau); o.start(t); o.stop(t + duree + 0.05);
  const n = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain(); n.buffer = tamponBruit(); f.type = 'lowpass'; f.frequency.value = 300;
  n.connect(f); f.connect(gn); gn.connect(s); enveloppe(gn, t, 0.004, 0.12, niveau * 0.6); n.start(t, Math.random(), 0.2);
 }
 function grincement(t, debut, fin, duree, niveau){
  const c = etat.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(debut, t); o.frequency.linearRampToValueAtTime(fin, t + duree * 0.5); o.frequency.linearRampToValueAtTime(debut * 1.1, t + duree);
  f.type = 'bandpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1100, t + duree); f.Q.value = 6;
  o.connect(f); f.connect(g); g.connect(sortieEffets()); enveloppe(g, t, duree * 0.2, duree, niveau); o.start(t); o.stop(t + duree + 0.05);
 }
 function souffleBref(t, duree, freq, niveau, q = 0.8){
  const c = etat.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  n.buffer = tamponBruit(); n.loop = true; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  n.connect(f); f.connect(g); g.connect(sortieEffets()); enveloppe(g, t, duree * 0.4, duree, niveau); n.start(t, Math.random()); n.stop(t + duree + 0.05);
 }
 function cloche(t){
  const c = etat.ctx;
  [[392, 0.1, 4.2], [392 * 2.76, 0.04, 2.6], [392 * 5.4, 0.02, 1.6]].forEach(([freq, niveau, duree]) => {
   const o = c.createOscillator(), g = c.createGain(); o.frequency.value = freq; o.connect(g); g.connect(sortieEffets()); enveloppe(g, t, 0.01, duree, niveau); o.start(t); o.stop(t + duree + 0.05); });
 }
 const SYNTHESE = {
  craquement: t => { grincement(t, 95, 62, 1.1, 0.2); },
  coups: t => { coup(t, 85, 0.5); coup(t + 0.42, 80, 0.45); if(Math.random() < 0.5) coup(t + 1.1, 90, 0.4); },
  pas: t => { for(let i = 0; i < 6; i++) coup(t + i * 0.62, i % 2 ? 52 : 62, 0.17, 0.18); },
  vent: t => { souffleBref(t, 3.6, 420, 0.32); },
  murmure: t => { for(let i = 0; i < 6; i++) souffleBref(t + i * 0.33, 0.28, 1700 + Math.random() * 800, 0.05, 5); },
  horloge: t => { for(let i = 0; i < 8; i++) souffleBref(t + i * 0.5, 0.04, 3500, 0.14, 8); },
  porte: t => { grincement(t, 230, 150, 1.6, 0.13); coup(t + 1.5, 70, 0.3); },
  cloche: t => cloche(t),
  // Sceau ouvert : un verrou qui claque, puis une grave résonance.
  'sceau-ouvert': t => { coup(t, 110, 0.6, 0.3); const c = etat.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = 1800; o.connect(g); g.connect(sortieEffets()); enveloppe(g, t + 0.1, 0.002, 0.03, 0.12); o.start(t + 0.1); o.stop(t + 0.16);
   [[73.4, 0.16, 2.4], [110, 0.08, 1.9]].forEach(([freq, niveau, duree]) => { const p = c.createOscillator(), q = c.createGain(); p.frequency.value = freq; p.connect(q); q.connect(sortieEffets()); enveloppe(q, t + 0.2, 0.3, duree, niveau); p.start(t + 0.2); p.stop(t + 0.2 + duree + 0.05); }); },
  // Indice découvert : deux notes claires qui montent, comme un éclat de verre.
  'indice-decouvert': t => { const c = etat.ctx; [[659.3, 0], [987.8, 0.16]].forEach(([freq, decalage]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(sortieEffets()); enveloppe(g, t + decalage, 0.01, 1.5, 0.13); o.start(t + decalage); o.stop(t + decalage + 1.55); }); },
  // Pouvoir révélé à la table : trois notes qui s'étirent, comme une présence qui se manifeste.
  // L'entité s'approche : deux coups sourds, un grincement lent, un souffle froid.
  approche: t => { coup(t, 70, 0.5, 0.28); coup(t + 0.55, 64, 0.55, 0.3); grincement(t + 1, 120, 70, 1.5, 0.12); souffleBref(t, 2.4, 320, 0.12, 2); },
  gravure: t => { grincement(t, 600, 250, 1.1, 0.1); souffleBref(t, 1.4, 1100, 0.06, 2); },
  pouvoir: t => { const c = etat.ctx; [[293.7, 0], [440, 0.22], [587.3, 0.44]].forEach(([freq, decalage]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = freq; o.connect(g); g.connect(sortieEffets()); enveloppe(g, t + decalage, 0.05, 2.2, 0.12); o.start(t + decalage); o.stop(t + decalage + 2.3); }); souffleBref(t, 2.4, 900, 0.1, 2); }
 };
 async function jouerEffet(id){
  if(!etat.ctx || etat.ctx.state === 'closed') return;
  try { etat.ctx.resume?.(); } catch {}
  let tampon = bruit.buffers[id];
  if(tampon === undefined){
   tampon = null;
   // Un nom sans extension : on cherche « nom.wav », puis .mp3, .m4a et .ogg. On peut aussi écrire l'extension (« pas.wav »).
   const candidats = /\.(mp3|m4a|wav|ogg)$/i.test(id) ? [id] : ['wav', 'mp3', 'm4a', 'ogg'].map(e => id + '.' + e);
   for(const fichier of candidats){
    try { const r = await fetch('assets/audio/effets/' + encodeURIComponent(fichier), {cache: 'no-store'}); if(r.ok && /audio|octet|mpeg|ogg|wav|wave/.test(r.headers.get('content-type') || '')){ tampon = await etat.ctx.decodeAudioData(await r.arrayBuffer()); break; } } catch {}
   }
   bruit.buffers[id] = tampon;
  }
  if(!tampon && !SYNTHESE[id]) return; // nom inconnu et fichier absent : rien à jouer
  bruit.joues.push(id);
  // La musique s'efface un peu pendant le bruit pour qu'on l'entende bien.
  const duree = tampon ? tampon.duration : (DUREES[id] || 3);
  const jeton = ++etat.jetonEffet; etat.effetEnCours = 1; regler();
  setTimeout(() => { if(jeton === etat.jetonEffet){ etat.effetEnCours = 0; regler(); } }, (duree + 0.4) * 1000);
  if(tampon){ const s = etat.ctx.createBufferSource(); s.buffer = tampon; s.connect(sortieEffets()); s.start(); return; }
  SYNTHESE[id]?.(etat.ctx.currentTime + 0.05);
 }
 const DUREES = {craquement: 1.4, coups: 2, pas: 4, vent: 4, murmure: 2.3, horloge: 4.5, porte: 2.2, cloche: 4.5, 'sceau-ouvert': 2.6, 'indice-decouvert': 1.8, pouvoir: 3, approche: 3};
 // Liste facultative assets/audio/effets/effets.json : les sons que vous avez déposés, au choix pour tous les moments
 // ([« a », « b »]) ou par moment ({ « debut »: […], « milieu »: […], « fin »: […] }). Sans liste, les huit bruits de base sont utilisés.
 async function listeEffets(){
  if(bruit.liste !== undefined) return bruit.liste;
  bruit.liste = null;
  try {
   const r = await fetch('assets/audio/effets/effets.json', {cache: 'no-store'});
   if(r.ok){ const j = await r.json(); const noms = a => Array.isArray(a) ? a.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : [];
    bruit.liste = Array.isArray(j) ? {tous: noms(j)} : {debut: noms(j.debut), milieu: noms(j.milieu), fin: noms(j.fin), tous: noms(j.tous)}; }
  } catch {}
  return bruit.liste;
 }
 const reglesEffets = () => { const l = bruit.liste; if(!l) return EFFETS; const g = groupeCourant(); const pool = l[g]?.length ? l[g] : l.tous?.length ? l.tous : EFFETS; return pool; };
 function groupeCourant(){ const e = etat.data?.progression?.active?.etape || (etat.resolues >= 5 ? 5 : 1); return e <= 2 ? 'debut' : e <= 4 ? 'milieu' : 'fin'; }
 function programmerEffet(delai){
  clearTimeout(bruit.minuterie); bruit.minuterie = null;
  if(!etat.ouvert || !etat.deverrouille || !etat.musiqueVoulue) return;
  const [min, max] = bruit.delais[groupeCourant()];
  bruit.minuterie = setTimeout(() => {
   if(!etat.ouvert || !etat.deverrouille || !etat.musiqueVoulue) return;
   // Jamais par-dessus une voix, une sonnerie ou un appel.
   if(!etat.voixEnCours && !archiveParle() && !etat.appel && !etat.sonnerie && !document.hidden){
    listeEffets().then(() => {
     if(!etat.ouvert || !etat.musiqueVoulue || etat.voixEnCours || archiveParle() || etat.appel || etat.sonnerie || document.hidden) return;
     const pool = reglesEffets(); if(!pool.length) return;
     let id; do { id = pool[Math.floor(Math.random() * pool.length)]; } while(id === bruit.dernier && pool.length > 1);
     bruit.dernier = id; jouerEffet(id);
    });
   }
   programmerEffet();
  }, delai ?? min + Math.random() * (max - min));
 }
 let musiqueActive = false;
 // La musique a son propre niveau (curseur « Musique ») et baisse pendant une voix, une sonnerie ou un bruit.
 function archiveParle(){ const a = $('pl-appel-retrouve')?.querySelector('audio'); return !!a && !a.paused && !a.ended; }
 function arreterArchive(){ const a = $('pl-appel-retrouve')?.querySelector('audio'); if(a) a.pause(); }
 function volumeEffectif(){ return etat.volume * etat.musiqueNiveau * (etat.voixEnCours || archiveParle() || etat.sonnerie ? 0.28 : etat.effetEnCours ? 0.5 : 1); }
 function regler(){
  voix.volume = Math.min(1, Math.max(0, etat.volume));
  const archive = $('pl-appel-retrouve')?.querySelector('audio');
  // L'archive est mesurée à -12,9 LUFS, contre -21,6 pour l'introduction.
  if(archive) archive.volume = voix.volume * 0.4;
  if(bruit.sortie) bruit.sortie.gain.value = etat.volume;
  if(etat.bus && etat.ctx) etat.bus.gain.setTargetAtTime(volumeEffectif(), etat.ctx.currentTime, 0.35);
  else musique.volume = Math.min(1, volumeEffectif());
 }
 function demarrerMusique(){
  if(!etat.deverrouille || !etat.musiqueVoulue || musiqueActive) return;
  musiqueActive = true;
  // Votre fichier ambiance.mp3 ou ambiance.wav s'il existe, sinon le souffle grave synthétique.
  let essai = 0, repli = false;
  const bascule = () => { if(repli) return; repli = true; drone.demarrer(); };
  const lire = () => {
   const numero = essai++, source = SRC_MUSIQUE[numero];
   if(!source) return bascule();
   let echoue = false; const echec = () => { if(echoue || numero !== essai - 1) return; echoue = true; lire(); };
   musique.onerror = echec; musique.loop = true; musique.src = source; regler();
   const p = musique.play(); if(p && p.catch) p.catch(echec);
  };
  lire();
  programmerEffet(20000); // premier bruit de la maison au bout d'une vingtaine de secondes
 }
 function arreterMusique(){ musiqueActive = false; try { musique.pause(); } catch {} drone.arreter(); clearTimeout(bruit.minuterie); bruit.minuterie = null; }

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
  if(etat.appel?.phase === 'sonne') sonnerie.demarrer();
  rendre();
  if(etat.enAttente){ const id = etat.enAttente; etat.enAttente = null; jouer(id, true); }
 }

 // --- Voix de la maison.
 function marquerJoue(id){ if(!etat.code) return; const cle = 'tu-etais-la-voix-' + etat.code, liste = lireSession(cle) || []; if(!liste.includes(id)){ liste.push(id); ecrireSession(cle, liste); } }
 const dejaJoue = id => (lireSession('tu-etais-la-voix-' + etat.code) || []).includes(id);
 function arreterVoix(){ etat.jeton++; try { voix.pause(); } catch {} etat.voixEnCours = false; regler(); }
 function finVoix(){ etat.voixEnCours = false; regler(); if(etat.appel?.phase === 'en-ligne') terminerAppel(); else rendre(); }

 // --- Appel entrant : chaque nouvelle voix de Sally sonne comme un téléphone, et il faut décrocher pour l'entendre.
 // Une sonnerie grave et dissonante, fabriquée par le navigateur (aucun fichier). Silencieuse tant que le son n'est pas déverrouillé.
 const sonnerie = {minuteur: null,
  salve(){
   if(!etat.ctx) return;
   const c = etat.ctx, t0 = c.currentTime, sortie = c.createGain(); sortie.gain.value = 0; sortie.connect(c.destination);
   const frequences=messageDe(etat.appel?.id)?.appelant==='entite'?[178,185]:[404,431];
   frequences.forEach(freq => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = freq; o.connect(sortie); o.start(t0); o.stop(t0 + 1.6); });
   const niveau = 0.16 * etat.volume;
   [0, 0.55].forEach(decalage => { sortie.gain.setValueAtTime(0, t0 + decalage); sortie.gain.linearRampToValueAtTime(niveau, t0 + decalage + 0.04); sortie.gain.setValueAtTime(niveau, t0 + decalage + 0.36); sortie.gain.linearRampToValueAtTime(0, t0 + decalage + 0.44); });
  },
  demarrer(){ this.arreter(); this.salve(); this.minuteur = setInterval(() => this.salve(), 2600); try { navigator.vibrate?.([300, 150, 300]); } catch {} },
  arreter(){ if(this.minuteur){ clearInterval(this.minuteur); this.minuteur = null; } }};
 function stopperMinuteries(){ clearTimeout(etat.minuterie); etat.minuterie = null; clearInterval(etat.chrono); etat.chrono = null; sonnerie.arreter(); etat.sonnerie = false; }
 const lireManques = () => lireSession('tu-etais-la-manques-' + etat.code) || [];
 function noterManque(id){ const liste = lireManques(); if(!liste.includes(id)){ liste.push(id); ecrireSession('tu-etais-la-manques-' + etat.code, liste); } etat.manques = liste; }
 function retirerManque(id){ const liste = lireManques().filter(x => x !== id); ecrireSession('tu-etais-la-manques-' + etat.code, liste); etat.manques = liste; }
 function appeler(id){
  if(id.startsWith('conclusion-'))etat.enAttente=null;
  if(etat.appel && etat.appel.phase !== 'termine') { noterManque(id); marquerJoue(id); rendre(); return; } // un appel à la fois : le suivant sera manqué
  arreterArchive(); stopperMinuteries(); marquerJoue(id);
  etat.appel = {id, phase: 'sonne', debut: Date.now()}; etat.sonnerie = true; regler();
  // Un sceau qui cède s'annonce d'abord par un claquement de verrou, puis le téléphone sonne.
  const sonner = () => { if(etat.appel?.id === id && etat.appel.phase === 'sonne' && etat.deverrouille) sonnerie.demarrer(); };
  // Sceau ouvert, puis nouvel indice découvert (de nouveaux fragments arrivent sur les téléphones), puis le téléphone sonne.
  if(id.startsWith('sceau') && etat.deverrouille){ jouerEffet('sceau-ouvert'); setTimeout(() => { if(etat.ouvert) jouerEffet('indice-decouvert'); }, 1300); setTimeout(sonner, 2900); } else sonner();
  etat.minuterie = setTimeout(() => { if(etat.appel?.id === id && etat.appel.phase === 'sonne') ignorer(true); }, etat.delaiSonnerie);
  rendre();
 }
 function decrocher(){
  if(!etat.appel || etat.appel.phase !== 'sonne') return;
  const id = etat.appel.id;
  deverrouiller(); stopperMinuteries(); retirerManque(id);
  etat.appel = {id, phase: 'en-ligne', debut: Date.now()};
  etat.chrono = setInterval(rendreChrono, 500);
  jouer(id, true);
 }
 function ignorer(manque){ if(!etat.appel) return; const id = etat.appel.id; stopperMinuteries(); noterManque(id); etat.appel = null; regler(); rendre(); }
 function terminerAppel(){
  if(!etat.appel) return; stopperMinuteries();
  etat.appel = {...etat.appel, phase: 'termine'}; rendre();
  const id = etat.appel.id; setTimeout(() => { if(etat.appel?.id === id && etat.appel.phase === 'termine'){ etat.appel = null; rendre(); } }, 1600);
 }
 function raccrocher(){ if(!etat.appel) return; arreterVoix(); terminerAppel(); }
 function rendreChrono(){ if(!etat.appel || etat.appel.phase !== 'en-ligne') return; const s = Math.floor((Date.now() - etat.appel.debut) / 1000); const el = $('pl-appel-duree'); if(el) el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
 function jouer(id, automatique){
  const m = messageDe(id); if(!m) return;
  if(!etat.deverrouille){ etat.enAttente = id; rendre(); return; }
  arreterArchive(); arreterVoix(); const jeton = ++etat.jeton;
  etat.courant = id; etat.voixEnCours = true; etat.absent = false; marquerJoue(id);
  const essayer = i => {
   const source = m.sources[i];
   if(!source){ if(jeton === etat.jeton){ etat.voixEnCours = false; etat.absent = true; etat.texteActuel = m.sources[0].texte; regler(); rendre(); } return; }
   let echoue = false;
   const echec = () => { if(echoue || jeton !== etat.jeton) return; echoue = true; essayer(i + 1); };
   voix.onerror = echec; voix.onended = () => { if(jeton === etat.jeton) finVoix(); };
   // Recharger l'enregistrement publié, même après un remplacement sous le même nom.
   etat.texteActuel = source.texte; voix.src = source.src + '?lecture=' + Date.now(); regler();
   const p = voix.play(); if(p && p.catch) p.catch(echec);
   rendre();
  };
  essayer(0);
 }

 // --- Annonces : un pouvoir révélé à toute la table s'affiche aussi sur l'iPad (sans nom ni camp).
 const TEXTES_ANNONCE = {
  talisman: {titre: 'Un talisman s’illumine', texte: 'Quelqu’un à cette table certifie un fragment : il est authentique.'},
  rempart: {titre: 'Un rempart se lève', texte: 'La Présence se tait pendant dix minutes.'},
  // Venue des erreurs de la table (pas d'un pouvoir) : repérée en comparant le compteur d'une synchronisation à l'autre.
  approche: {etiquette: 'L’entité', titre: 'L’entité s’est rapprochée', texte: 'Une erreur l’a attirée. Quelque part dans cette maison, un souvenir vacille.'},
  mur: {etiquette: 'Le mur', titre: 'Une voix dans le mur', texte: 'Un souvenir vient d’être gravé. À vous de le confronter aux autres fragments.'}
 };
 function afficherAnnonce(){
  if(etat.annonceCourante || !etat.fileAnnonces.length) return;
  const a = etat.annonceCourante = etat.fileAnnonces.shift();
  // Le son d'annonce ne couvre jamais une voix ni un appel : le bandeau, lui, s'affiche toujours.
  if(etat.deverrouille && !etat.voixEnCours && !archiveParle() && !etat.appel && !etat.sonnerie) jouerEffet(a.type === 'approche' ? 'approche' : a.type === 'mur' ? 'gravure' : 'pouvoir');
  clearTimeout(etat.minuterieAnnonce); etat.minuterieAnnonce = setTimeout(masquerAnnonce, 14000);
  rendre();
 }
 function masquerAnnonce(){ clearTimeout(etat.minuterieAnnonce); etat.annonceCourante = null; rendre(); setTimeout(afficherAnnonce, 600); }
 // L'entité s'est-elle rapprochée depuis la dernière synchronisation ? Le premier regard sur une partie n'annonce rien.
 function suivreApproches(){
  const er = etat.erreurs; if(!etat.code || !er) return;
  const cle = 'tu-etais-la-approches-' + etat.code, vu = lireSession(cle), total = er.declenchements_total;
  if(vu === null){ ecrireSession(cle, total); return; }
  if(total > vu){ ecrireSession(cle, total); if(etat.ouvert){ etat.fileAnnonces.push({id: 'approche-' + total, type: 'approche', fragment: ''}); afficherAnnonce(); } }
 }
 function recevoirAnnonces(liste){
  if(!etat.code || !Array.isArray(liste)) return;
  const cle = 'tu-etais-la-annonces-' + etat.code, vus = lireSession(cle), ids = liste.map(a => a.id);
  etat.annonces = liste;
  // Premier regard sur cette partie (ou rechargement) : on note ce qui est déjà arrivé, sans le rejouer.
  if(vus === null){ ecrireSession(cle, ids); rendre(); return; }
  const nouvelles = liste.filter(a => !vus.includes(a.id) && TEXTES_ANNONCE[a.type]);
  if(nouvelles.length){ ecrireSession(cle, [...vus, ...nouvelles.map(a => a.id)]); etat.fileAnnonces.push(...nouvelles); afficherAnnonce(); }
  rendre();
 }
 function surveillerPouvoirs(){ clearInterval(etat.sondePouvoirs); etat.sondePouvoirs = null; if(etat.ouvert) etat.sondePouvoirs = setInterval(() => { try { window.lirePouvoirs?.(); } catch {} }, 6000); }
 function suivreMur(){
  const gravures=etat.data?.progression?.mur;
  if(!Array.isArray(gravures)||!etat.code)return;
  const cle='tu-etais-la-mur-'+etat.code,connues=lireSession(cle),ids=gravures.map(g=>g.id);
  ecrireSession(cle,ids);
  // Une reprise affiche le registre sans rejouer ses annonces historiques.
  if(!Array.isArray(connues)||!etat.ouvert)return;
  const nouvelles=gravures.filter(g=>!connues.includes(g.id));
  etat.fileAnnonces.push(...nouvelles.map(g=>({id:g.id,type:'mur',fragment:`Énigme ${g.etape} — ${g.texte}`})));
  afficherAnnonce();
 }

 // --- Rendu.
 function echapper(t){ return String(t).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); }
 // Preuves publiques de la nouvelle chronologie : activation explicite par le serveur.
 // Ni le relevé du couloir, ni l'appel privé, ni la solution ne figurent ici.
 const PHOTO_RESERVE = 'assets/preuves/affaire-01/reserve-vide.png';
 // Scènes fixes : seule l'étape publique ou l'issue révélée choisit l'image.
 // Elles ne contiennent ni répartition privée ni indication de la bonne porte.
 const SCENES_RESERVE = {
  1:{src:PHOTO_RESERVE,alt:'La réserve vide, le panneau déplacé et le renfoncement maçonné.',texte:'La porte ordinaire a été ouverte. Sally n’était plus dans la réserve.'},
  2:{src:'assets/scenes/affaire-01/sceau-02-passage.png',alt:'Vue rapprochée du renfoncement et du panneau écarté, dans la même réserve.',texte:'Au fond de la réserve, les traces du panneau apparaissent plus nettement.'},
  3:{src:'assets/scenes/affaire-01/sceau-03-envers.png',alt:'La réserve dans l’envers, baignée de lumière froide et de brume.',texte:'Les mêmes murs, les mêmes objets. De l’autre côté, la maison ne semble plus tout à fait la même.'},
  4:{src:'assets/scenes/affaire-01/sceau-04-protection.png',alt:'Un passage fermé dans l’envers, entouré d’une lumière ambrée.',texte:'Une lueur tient encore autour du passage. La maison garde sa frontière.'},
  5:{src:'assets/scenes/affaire-01/sceau-05-portes.png',alt:'Cinq portes fermées, aux signes de Lune, Cendre, Ronce, Verre et Seuil.',texte:'Cinq portes attendent. Aucune image ne vous dira laquelle choisir.'}
 };
 const SCENES_CONCLUSION = {
  1:{src:'assets/scenes/affaire-01/fin-01-sally.png',alt:'Sally revient dans la réserve, émue et soulagée, dans une lumière chaude.'},
  2:{src:'assets/scenes/affaire-01/fin-02-entite.png',alt:'Une présence noire a franchi le seuil et envahit la réserve.'},
  3:{src:'assets/scenes/affaire-01/fin-03-scellee.png',alt:'Le seuil reste fermé et barré. Une lumière froide subsiste de l’autre côté.'},
  4:{src:'assets/scenes/affaire-01/fin-04-enfermes.png',alt:'Depuis l’intérieur de la maison, la dernière porte se referme sur un mince filet de lumière.'},
  5:{src:'assets/scenes/affaire-01/fin-05-silence.png',alt:'Le passage a disparu dans un mur plein. La réserve est vide et silencieuse.'}
 };
 function sceneReserve(data){
  const prog=data?.progression;
  if(Number(data?.partie?.scenario_id)!==1||(!prog?.initialise&&!prog?.active&&!prog?.portes))return null;
  if(prog.portes?.phase==='fin'){
   const issue=Number(prog.portes.resultat?.issue),scene=SCENES_CONCLUSION[issue];
   return scene?{...scene,id:'fin-'+issue,texte:FINS_VISUELLES[issue].texte}:null;
  }
  const etape=prog.portes?5:Number(prog.active?.etape||(Number(prog.resolues)>=5?5:0));
  return SCENES_RESERVE[etape]?{...SCENES_RESERVE[etape],id:'sceau-'+etape}:null;
 }
 function chargerScene(image,scene){
  if(image.dataset.sceneDemandee===scene.src)return;
  image.dataset.sceneDemandee=scene.src;
  const apercu=new Image();apercu.decoding='async';apercu.fetchPriority='high';
  apercu.onload=async()=>{
   try{await apercu.decode()}catch{}
   if(image.dataset.sceneDemandee!==scene.src)return;
   image.src=scene.src;image.alt=scene.alt;image.dataset.sceneRendue=scene.id;
   delete image.dataset.sceneErreur;
  };
  apercu.onerror=()=>{if(image.dataset.sceneDemandee===scene.src)image.dataset.sceneErreur=scene.id};
  // Conserver la scène précédente pendant le chargement évite une grande zone vide.
  apercu.src=scene.src;
 }
 function rendreScene(data,affaire){
  const scene=sceneReserve(data),image=$('pl-image'),vue=$('pl-vue');
  const precedente=$('plateau').dataset.scene;
  $('plateau').classList.toggle('pl-scenes',!!scene);
  if(scene){
   $('plateau').dataset.scene=scene.id;
   chargerScene(image,scene);
   image.alt=scene.alt;vue.hidden=false;$('pl-trace').textContent=scene.texte;
   if(precedente!==scene.id)requestAnimationFrame(()=>{
    if($('plateau').dataset.scene!==scene.id)return;
    for(const bloc of document.querySelectorAll('#plateau .pl-centre,#plateau .pl-sceau'))bloc.scrollTop=0;
   });
  }else{
   image.dataset.sceneDemandee='';
   delete $('plateau').dataset.scene;
   vue.hidden=!affaire?.image;
   if(affaire?.image&&image.getAttribute('src')!==affaire.image)image.src=affaire.image;
   image.alt='Illustration d’ambiance de l’affaire';$('pl-trace').textContent=affaire?.intro||'';
  }
 }
 const EVENEMENTS_RESERVE = ['Appel', 'Panneau déplacé', 'Porte refermée', 'Entrée', 'Message'];
 function supportReserve(data){
  const actif=data?.progression?.active, support=actif?.support_public;
  const message=support?.message;
  return Number(data?.partie?.scenario_id)===1 && Number(actif?.etape)===1 && !data?.progression?.portes &&
   support?.type==='affaire-01-chronologie-v1' && /^([01]\d|2[0-3]):[0-5]\d$/.test(message?.heure||'') &&
   Array.isArray(message?.lignes) && message.lignes.length===3 && message.lignes.every(l=>typeof l==='string'&&l.length>0&&l.length<=200)
   ? support : null;
 }
 function rendrePreuvesReserve(data){
  let bloc=$('pl-preuves-reserve');
  const support=supportReserve(data), actif=!!support;
  $('plateau').classList.toggle('pl-preuves-reserve',actif);
  if(!actif){
   if(bloc)bloc.hidden=true;
   if($('pl-appel-retrouve'))$('pl-appel-retrouve').querySelector('audio').pause();
   if($('pl-photo-dialog')?.open)$('pl-photo-dialog').close();
   $('pl-image').alt='Illustration d’ambiance de l’affaire';
   return;
  }
  const liee=data.progression.active.enonce.includes('authentifier cette chronologie');
  const horloge=liee||['L’heure véritable','Le temps derrière la porte'].includes(data.progression.active.titre);
  $('pl-enonce').textContent=horloge?data.progression.active.enonce:"Reconstituez précisément ce qui est arrivé à Sally et dans l'ordre précis. Chaque joueur possède un indice. Racontez ce que chaque preuve vous apprend. Une fois l’ordre trouvé, une personne écrit dans Telegram « je propose » suivi des cinq événements dans l'ordre, séparés par des virgules.";
  if(!bloc){
   bloc=document.createElement('section');bloc.id='pl-preuves-reserve';bloc.setAttribute('aria-label','Les traces communes');
   bloc.innerHTML='<article class="pl-message-sally" aria-label="Message de Sally"><header><strong>Sally</strong><time></time></header><p></p></article><button id="pl-photo-ouvrir" type="button" aria-haspopup="dialog">Examiner la photo de la réserve</button><h3>À classer du premier au dernier</h3><ul class="pl-evenements-reserve">'+EVENEMENTS_RESERVE.map(e=>'<li>'+e+'</li>').join('')+'</ul><p class="pl-reponse-reserve"><strong>Message</strong> désigne le texte de Sally affiché ici. <strong>Entrée</strong> désigne son entrée dans la réserve. <strong>Appel</strong> désigne le vocal privé reçu dans Telegram, pas l’appel d’introduction sur l’iPad.</p><p class="pl-reponse-reserve">Certains indices sont fragmentés. Comparez les références de vos preuves : les morceaux portant la même référence se complètent. Les extraits vocaux de cette énigme proviennent tous du même appel de Sally. Racontez le contenu de votre morceau pour reconstruire l’ensemble.</p>';
   $('pl-enonce').after(bloc);
   const dialogue=document.createElement('dialog');dialogue.id='pl-photo-dialog';dialogue.setAttribute('aria-labelledby','pl-photo-titre');
   dialogue.innerHTML='<header><h2 id="pl-photo-titre">La réserve après sa disparition</h2><button type="button">Fermer la photo</button></header><img src="'+PHOTO_RESERVE+'" alt="La réserve est vide. Un panneau écarté révèle un renfoncement maçonné au fond de la pièce."><p>Photographie prise après l’ouverture de la porte par le groupe.</p>';
   document.body.append(dialogue);
   dialogue.querySelector('button').addEventListener('click',()=>dialogue.close());
   $('pl-photo-ouvrir').addEventListener('click',()=>{if(supportReserve(etat.data)&&!dialogue.open)dialogue.showModal()});
  }
  bloc.hidden=false;
  bloc.querySelector('h3').hidden=horloge&&!liee;
  bloc.querySelector('.pl-evenements-reserve').hidden=horloge&&!liee;
  bloc.querySelector('.pl-reponse-reserve').hidden=horloge;
  bloc.querySelectorAll('.pl-reponse-reserve')[1].textContent=horloge?'Comparez les références : les morceaux d’un même document ou message se complètent. Les heures du relevé caméra doivent être corrigées grâce aux autres fragments.':'Certains indices sont fragmentés. Comparez les références de vos preuves : les morceaux portant la même référence se complètent. Les extraits vocaux de cette énigme proviennent tous du même appel de Sally. Racontez le contenu de votre morceau pour reconstruire l’ensemble.';
  let archive=$('pl-appel-retrouve');
  if(liee&&!archive){archive=document.createElement('article');archive.id='pl-appel-retrouve';archive.className='pl-archive-retour';archive.innerHTML='<p class="pl-archive-cote">LA RÉSERVE · ENREGISTREMENT RETROUVÉ</p><h3>Ce qui s’est passé derrière le panneau</h3><p>Écoutez ensemble cette trace de Sally pour reconstituer les événements. Vos fragments Telegram permettront ensuite d’en authentifier les horaires.</p><audio controls preload="none" src="assets/preuves/affaire-01/appel-sally.mp3" aria-label="Appel retrouvé de Sally"></audio><p>Cette archive correspond à l’événement « Appel ». L’introduction de l’iPad présente l’enquête.</p>';bloc.append(archive);const lecteur=archive.querySelector('audio');lecteur.addEventListener('play',()=>{if(etat.appel || etat.sonnerie){lecteur.pause();return;}arreterVoix();regler();});for(const evenement of ['pause','ended','error'])lecteur.addEventListener(evenement,regler);regler();}
  if(archive){archive.hidden=!liee;if(!liee)archive.querySelector('audio').pause();}
  bloc.querySelector('time').textContent=support.message.heure;
  bloc.querySelector('time').dateTime=support.message.heure;
  bloc.querySelector('.pl-message-sally p').textContent=support.message.lignes.join('\n');
  if($('pl-image').getAttribute('src')!==PHOTO_RESERVE)$('pl-image').src=PHOTO_RESERVE;
  $('pl-image').alt='La réserve vide : un panneau déplacé au fond de la pièce et des traces dans la poussière.';
  $('pl-vue').hidden=false;
  $('pl-trace').textContent='La porte ordinaire a été ouverte. Sally n’était plus dans la réserve.';
 }
 function rendrePreuvesPassage(data){
  const actif=Number(data?.partie?.scenario_id)===1&&Number(data?.progression?.active?.etape)===2&&data.progression.active.support_public?.type==='affaire-01-passage-v1'&&!data.progression.portes;
  let bloc=$('pl-preuves-passage');
  if(!actif){if(bloc)bloc.hidden=true;if($('pl-plan-dialog')?.open)$('pl-plan-dialog').close();return}
  $('pl-enonce').textContent=data.progression.active.enonce;
  if(!bloc){
   bloc=document.createElement('section');bloc.id='pl-preuves-passage';bloc.setAttribute('aria-label','Le plan commun de la réserve');
   bloc.innerHTML='<button id="pl-plan-ouvrir" type="button" aria-haspopup="dialog"><img src="assets/preuves/affaire-01/passage-v1/plan-actuel.png" alt="Aperçu du relevé actuel" width="960" height="1280"><span>Consulter le plan actuel<small>Document commun — comparer aux archives reçues dans Telegram</small></span></button>';
   $('pl-enonce').after(bloc);
   const dialogue=document.createElement('dialog');dialogue.id='pl-plan-dialog';dialogue.className='pl-document-dialog';dialogue.setAttribute('aria-labelledby','pl-plan-titre');
   dialogue.innerHTML='<header><h2 id="pl-plan-titre">Le relevé actuel des pièces de service</h2><button type="button">Fermer le plan</button></header><img src="assets/preuves/affaire-01/passage-v1/plan-actuel.png" alt="Plan actuel : une seule porte ordinaire dans la réserve, des étagères sur les côtés et un mur plein au fond. Atelier et escalier de service à côté." width="960" height="1280">';
   document.body.append(dialogue);dialogue.querySelector('button').addEventListener('click',()=>dialogue.close());
   $('pl-plan-ouvrir').addEventListener('click',()=>{if(!bloc.hidden&&!dialogue.open)dialogue.showModal()});
  }
  bloc.hidden=false;
 }
 function imagePlanChemin(support){
  const lieux=support?.lieux,liaisons=support?.liaisons,permis=['Réserve','Office','Cave','Palier','Vestibule','Galerie'];
  if(!Array.isArray(lieux)||lieux.length!==6||new Set(lieux).size!==6||!lieux.every(x=>permis.includes(x))||!Array.isArray(liaisons)||liaisons.length!==11||!liaisons.every(l=>Array.isArray(l)&&l.length===2&&l.every(x=>lieux.includes(x))))return 'assets/preuves/affaire-01/chemin-v1/plan-envers.png';
  const points=[[110,390],[370,190],[370,600],[710,190],[710,600],[970,390]],index=Object.fromEntries(lieux.map((l,i)=>[l,i]));
  const traits=liaisons.map(([a,b])=>{const i=index[a],j=index[b],[x,y]=points[i],[xx,yy]=points[j],dx=xx-x,dy=yy-y,d=Math.hypot(dx,dy),sx=x+dx/d*87,sy=y+dy/d*48,ex=xx-dx/d*95,ey=yy-dy/d*56;return '<path d="M '+sx+' '+sy+' L '+ex+' '+ey+'"/>'}).join('');
  const salles=lieux.map((l,i)=>{const [x,y]=points[i];return '<g><rect x="'+(x-90)+'" y="'+(y-35)+'" width="180" height="70" rx="3"/><text x="'+x+'" y="'+(y+8)+'">'+l+'</text></g>'}).join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="780" viewBox="0 0 1080 780"><defs><marker id="fleche" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0 0 L8 3 L0 6" fill="none" stroke="#524632" stroke-width="1.4"/></marker></defs><rect width="1080" height="780" fill="#e4d8ba"/><rect x="16" y="16" width="1048" height="748" fill="none" stroke="#8c7957"/><text x="540" y="70" text-anchor="middle" font-family="Georgia" font-size="30" fill="#352e23">Les accès dans l’envers — cette nuit</text><text x="540" y="110" text-anchor="middle" font-family="Georgia" font-size="19" fill="#524632">Suivez les flèches. Les restrictions restent dans vos preuves privées.</text><g fill="none" stroke="#524632" stroke-width="2.5" marker-end="url(#fleche)">'+traits+'</g><g fill="#eee3c8" stroke="#65583f">'+salles+'</g><style>g text{fill:#352e23;stroke:none;text-anchor:middle;font:24px Georgia}</style><text x="540" y="720" text-anchor="middle" font-family="Georgia" font-size="19" fill="#524632">Départ : Réserve · Arrivée : Galerie · Un seul passage par lieu</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 }
 function rendrePreuvesChemin(data){
  const support=data?.progression?.active?.support_public;
  const actif=Number(data?.partie?.scenario_id)===1&&Number(data?.progression?.active?.etape)===3&&support?.type==='affaire-01-chemin-v1'&&!data.progression.portes;
  let bloc=$('pl-preuves-chemin');
  if(!actif){if(bloc)bloc.hidden=true;if($('pl-chemin-dialog')?.open)$('pl-chemin-dialog').close();return}
  $('pl-enonce').textContent=data.progression.active.enonce;
  if(!bloc){
   bloc=document.createElement('section');bloc.id='pl-preuves-chemin';bloc.setAttribute('aria-label','Le plan commun des accès dans l’envers');
   bloc.innerHTML='<button id="pl-chemin-ouvrir" class="pl-plan-commun" type="button" aria-haspopup="dialog"><img src="assets/preuves/affaire-01/chemin-v1/plan-envers.png" alt="Aperçu du plan des accès" width="1280" height="1280"><span>Consulter le plan de l’envers<small>De la Réserve à la Galerie — recoupez vos relevés privés dans Telegram</small></span></button>';
   $('pl-enonce').after(bloc);
   const dialogue=document.createElement('dialog');dialogue.id='pl-chemin-dialog';dialogue.className='pl-document-dialog';dialogue.setAttribute('aria-labelledby','pl-chemin-titre');
   dialogue.innerHTML='<header><h2 id="pl-chemin-titre">Le chemin dans l’envers</h2><button type="button">Fermer le plan</button></header><img src="assets/preuves/affaire-01/chemin-v1/plan-envers.png" alt="Plan dirigé de six lieux : Réserve, Office, Cave, Palier, Vestibule et Galerie. Les accès sont détaillés dans la liste ci-dessous." width="1280" height="1280"><details><summary>Lire la liste des accès</summary><ul id="pl-chemin-acces"></ul></details>';
   document.body.append(dialogue);dialogue.querySelector('button').addEventListener('click',()=>dialogue.close());
   $('pl-chemin-ouvrir').addEventListener('click',()=>{if(!bloc.hidden&&!dialogue.open)dialogue.showModal()});
  }
  const liste=$('pl-chemin-acces');liste.replaceChildren();
  const image=imagePlanChemin(support);
  bloc.querySelector('img').src=image;$('pl-chemin-dialog').querySelector('img').src=image;
  if(Array.isArray(support.liaisons))for(const liaison of support.liaisons){if(!Array.isArray(liaison)||liaison.length!==2||!liaison.every(x=>typeof x==='string'))continue;const item=document.createElement('li');item.textContent=liaison.join(' → ');liste.append(item)}
  bloc.hidden=false;
 }
 function rendrePreuvesRetour(data){
  const support=data?.progression?.active?.support_public;
  const actif=Number(data?.partie?.scenario_id)===1&&Number(data?.progression?.active?.etape)===4&&support?.type==='affaire-01-retour-v1'&&!data.progression.portes;
  let bloc=$('pl-preuves-retour');
  if(!actif){if(bloc)bloc.hidden=true;if($('pl-retour-dialog')?.open)$('pl-retour-dialog').close();return}
  $('pl-enonce').textContent=data.progression.active.enonce;
  if(!bloc){
   bloc=document.createElement('section');bloc.id='pl-preuves-retour';bloc.setAttribute('aria-label','Les instructions de préparation du retour');
   bloc.innerHTML='<ul id="pl-retour-instructions" class="pl-instructions-retour" aria-label="Instructions mélangées"></ul><button id="pl-retour-ouvrir" class="pl-plan-commun" type="button" aria-haspopup="dialog"><img src="assets/preuves/affaire-01/retour-v1/gestes-preparation.png" alt="Aperçu des gestes de préparation" width="960" height="1280"><span>Consulter les gestes de préparation<small>Notice commune — confrontez les raccords reçus dans Telegram</small></span></button>';
   $('pl-enonce').after(bloc);
   const dialogue=document.createElement('dialog');dialogue.id='pl-retour-dialog';dialogue.className='pl-document-dialog';dialogue.setAttribute('aria-labelledby','pl-retour-titre');
   dialogue.innerHTML='<header><h2 id="pl-retour-titre">Préparer le retour sous protection</h2><button type="button">Fermer la notice</button></header><img src="assets/preuves/affaire-01/retour-v1/gestes-preparation.png" alt="Cinq instructions mélangées : attendre le choix, préparer, vérifier, raccorder et maintenir. Les relations entre elles se trouvent dans les feuillets privés." width="960" height="1280">';
   document.body.append(dialogue);dialogue.querySelector('button').addEventListener('click',()=>dialogue.close());
   $('pl-retour-ouvrir').addEventListener('click',()=>{if(!bloc.hidden&&!dialogue.open)dialogue.showModal()});
  }
  const liste=$('pl-retour-instructions');liste.replaceChildren();
  const notice=data.progression.active.enonce.includes('procédure de cette nuit')?'assets/preuves/affaire-01/rejouabilite-v1/gestes-protection.png':'assets/preuves/affaire-01/retour-v1/gestes-preparation.png';
  bloc.querySelector('img').src=notice;$('pl-retour-dialog').querySelector('img').src=notice;
  const dispositif=support.dispositif;
  if(dispositif?.schema==='boitier-retour-v1'){
   bloc.querySelector('img').src='assets/preuves/affaire-01/boitier-retour-photo-v1.jpg';$('pl-retour-dialog').querySelector('img').src='assets/preuves/affaire-01/boitier-retour-photo-v1.jpg';
   for(const img of [bloc.querySelector('img'),$('pl-retour-dialog').querySelector('img')])img.onerror=()=>{img.onerror=null;img.src='assets/preuves/affaire-01/boitier-retour.svg';};
   const dialogue=$('pl-retour-dialog');dialogue.classList.add('pl-boitier-photo');
   let schema=$('pl-boitier-schema');if(!schema){schema=document.createElement('details');schema.id='pl-boitier-schema';schema.innerHTML='<summary>Identifier les cinq pièces du boîtier</summary><img src="assets/preuves/affaire-01/boitier-retour.svg" alt="Schéma légendé : loquet en haut à gauche, cadran au centre, plaque en haut à droite, borne en bas à gauche, capot en bas à droite." width="1100" height="720" loading="lazy">';dialogue.querySelector('img').after(schema);}schema.hidden=false;
   for(const img of [bloc.querySelector('img'),$('pl-retour-dialog').querySelector('img')])img.alt='Boîtier de retour : loquet du rempart, borne Galerie, plaque de contrôle, cadran du seuil et capot d’ouverture.';
   $('pl-retour-ouvrir').querySelector('span').firstChild.textContent='Examiner le boîtier de retour';
   let reperes=$('pl-retour-reperes');if(!reperes){reperes=document.createElement('div');reperes.id='pl-retour-reperes';reperes.className='pl-reperes-retour';bloc.prepend(reperes);}
   reperes.hidden=false;reperes.replaceChildren();for(const [titre,valeur] of [['Cadran · découverte du sceau II',dispositif.seuil],['Plaque · dernier contrôle du sceau III',dispositif.relais]]){const carte=document.createElement('article'),t=document.createElement('small'),v=document.createElement('strong');t.textContent=titre;v.textContent=valeur;carte.append(t,v);reperes.append(carte);}
   let legendes=$('pl-boitier-legendes');if(!legendes){legendes=document.createElement('dl');legendes.id='pl-boitier-legendes';$('pl-retour-dialog').append(legendes);}legendes.replaceChildren();for(const [geste,texte] of Object.entries(dispositif.gestes||{})){const terme=document.createElement('dt'),explication=document.createElement('dd');terme.textContent=geste;explication.textContent=texte;legendes.append(terme,explication);}
  }else{$('pl-retour-dialog').classList.remove('pl-boitier-photo');if($('pl-boitier-schema'))$('pl-boitier-schema').hidden=true;for(const img of [bloc.querySelector('img'),$('pl-retour-dialog').querySelector('img')])img.onerror=null;if($('pl-retour-reperes'))$('pl-retour-reperes').hidden=true;if($('pl-boitier-legendes'))$('pl-boitier-legendes').replaceChildren();}
  if(Array.isArray(support.instructions))for(const instruction of support.instructions){if(typeof instruction!=='string'||instruction.length>80)continue;const item=document.createElement('li');item.textContent=instruction;liste.append(item)}
  bloc.hidden=false;
 }
 function rendreAideReponse(prog){
  let aide=$('pl-aide-reponse');
  if(!aide){
   aide=document.createElement('section');aide.id='pl-aide-reponse';aide.setAttribute('aria-label','Partager les indices et répondre');
   aide.innerHTML='<p id="pl-aide-consigne"></p><details><summary>Comment partager les indices et répondre ?</summary><ol id="pl-aide-etapes"></ol><p id="pl-aide-exemple"></p><p>Pour répondre à Sally, écrivez dans votre conversation privée avec elle sur Telegram. Gardez votre camp et votre objectif secrets ; racontez vos indices sans faire circuler vos téléphones.</p><p>Le signal qui vous relie à Sally est fragile. Vous reconnaissez sa voix… mais, parfois, quelque chose semble se glisser entre ses mots.</p></details>';
   $('pl-enonce').after(aide);
  }
  const portes=prog?.portes,fin=portes?.phase==='fin';aide.hidden=fin||(!prog?.active&&!portes);if(aide.hidden)return;
  const vote=portes&&['vote','vote_2'].includes(portes.phase);
  const consigne=portes?(vote?'Chacun écrit son propre vote en privé dans Telegram.':'Comparez vos exclusions à voix haute, puis préparez votre vote.'):'Discutez à voix haute. Une seule personne écrit ensuite la réponse complète dans Telegram : « je propose… ».';
  const etapes=portes?[
   'Chacun raconte ce que ses indices permettent d’écarter. Confrontez les affirmations : les joueurs n’ont pas tous le même objectif.',
   'Quand vous avez fini de discuter, chacun écrit « prêt à voter » à Sally. Attendez le message annonçant l’ouverture du vote.',
   'Une fois le vote ouvert, chacun écrit son choix dans Telegram : « je vote la porte de… », suivi du nom de la porte. Ce choix reste privé.'
  ]:[
   'Après l’appel commun sur l’iPad, demandez votre indice dans Telegram avec « Recevoir mon indice » ou /indice. Écoutez les audios privés avec des écouteurs.',
   'Faites un tour de table : chacun raconte ce qu’il a appris. Comparez ces informations aux documents communs sur l’iPad. Vous n’avez pas tous le même fragment ; demandez aux autres ce qui manque.',
   'Quand vous avez une proposition, choisissez une personne pour l’écrire en entier à Sally dans Telegram, en commençant par « je propose ». N’envoyez pas chaque fragment séparément. Attendez sa réponse avant de proposer à nouveau.'
  ];
  // Les synchronisations ne referment pas l’aide pendant sa lecture.
  $('pl-aide-consigne').textContent=consigne;
  $('pl-aide-etapes').replaceChildren(...etapes.map(texte=>{const li=document.createElement('li');li.textContent=texte;return li}));
  $('pl-aide-exemple').textContent=portes?'Au dernier sceau, « je propose » ne choisit pas la porte : il faut un vote de chaque joueur.':'Exemple fictif : une personne sait « A avant B », une autre « B avant C ». Vous en déduisez ensemble A → B → C. Une seule personne écrit alors « je propose A, B, C ». Utilisez les mots demandés par votre énigme.';
  if(!portes&&prog?.active?.titre==='L’heure véritable')$('pl-aide-exemple').textContent='Format de réponse : « je propose HH:MM:SS, HH:MM:SS ». Donnez d’abord l’entrée, puis la fermeture ; utilisez les heures corrigées grâce à vos fragments.';
  if(!portes&&prog?.active?.titre==='Le temps derrière la porte')$('pl-aide-exemple').textContent='Format de réponse : « je propose [minutes] min [secondes] s ». Calculez la durée entre l’entrée et la réouverture, en utilisant l’heure réelle de chaque événement.';
  if(!portes&&prog?.active?.enonce?.includes('authentifier cette chronologie'))$('pl-aide-exemple').textContent='Une seule réponse complète : « je propose [les cinq événements] ; heures : [entrée], [fermeture] » ou « je propose [les cinq événements] ; durée : [minutes] min [secondes] s », selon la consigne. Recoupez le récit et les horaires.';
  if(portes?.registre_lie)$('pl-aide-exemple').textContent='Utilisez le carnet : nom du seuil (II), dernier lieu avant la Galerie (III), geste juste avant ATTENDRE LE CHOIX (IV). Dans chaque tableau privé, la ligne correspondante donne une porte à écarter. Ne mélangez pas les lignes de parties différentes.';
 }
 function rendreDossierRetour(prog){
  let bloc=$('pl-dossier-retour');const actif=prog?.portes?.registre_lie&&prog.portes.phase!=='fin';
  if(!actif){if(bloc)bloc.hidden=true;return;}
  if(!bloc){bloc=document.createElement('section');bloc.id='pl-dossier-retour';bloc.className='pl-archive-retour';bloc.setAttribute('aria-label','Repères pour lire les archives privées');$('pl-portes-consigne').after(bloc);}
  const lire=n=>(prog.carnet||[]).find(e=>Number(e.etape)===n)?.reponse||'',chemin=lire(3).split(/\s*→\s*/),gestes=lire(4).split(/\s*;\s*/)[0].split(/\s*→\s*/);
  const valeurs=[['II · Nom du seuil',lire(2).split(' : ')[0]],['III · Dernier lieu avant la Galerie',chemin.at(-2)],['IV · Geste juste avant l’attente',gestes.at(-2)]];
  bloc.hidden=false;bloc.innerHTML='<p class="pl-archive-cote">VOS DÉCOUVERTES SERVENT MAINTENANT</p><div class="pl-reperes-retour"></div><p>Choisissez la ligne correspondante dans vos tableaux Telegram. Elle donne une porte à écarter ; confrontez ensuite vos déductions.</p>';
  const liste=bloc.querySelector('.pl-reperes-retour');for(const [titre,valeur] of valeurs){const carte=document.createElement('article'),t=document.createElement('small'),v=document.createElement('strong');t.textContent=titre;v.textContent=valeur||'Consultez le carnet commun';carte.append(t,v);liste.append(carte);}
 }
 function rendre(){
  const ov = $('plateau'); if(!ov) return;
  ov.hidden = !etat.ouvert; document.body.classList.toggle('plateau-ouvert', etat.ouvert);
  if(!etat.ouvert) return;
  const data = etat.data, partie = data?.partie, prog = data?.progression;
  const affaire = etat.affaires?.find(a => a.id === partie?.scenario_id);
  $('pl-titre-affaire').textContent = affaire?.title || (supportReserve(data)?'La porte qu’on n’a pas ouverte':'La maison');
  const actif = prog?.active, resolues = prog?.resolues || 0;
  $('pl-sceau-num').textContent = actif ? `SCEAU ${ROMAINS[actif.etape - 1]} SUR V` : 'LES CINQ SCEAUX SONT OUVERTS';
  $('pl-titre').textContent = actif ? actif.titre : 'Le rituel est prêt.';
  $('pl-enonce').textContent = actif ? enonceCourt(actif.enonce) : 'Il ne reste qu’à choisir la porte.';
  rendrePreuvesReserve(data);
  rendrePreuvesPassage(data);
  rendrePreuvesChemin(data);
  rendrePreuvesRetour(data);
  rendreScene(data,affaire);
  $('pl-sceaux').innerHTML = ROMAINS.map((r, i) => `<li class="${i < resolues ? 'ouvert' : actif && actif.etape === i + 1 ? 'courant' : ''}" aria-label="Sceau ${i + 1}${i < resolues ? ' ouvert' : ''}"><span>${r}</span></li>`).join('');
  // Compteur d'erreurs de l'énigme en cours et proximité de l'entité (nombres seulement).
  const er = etat.erreurs, vers = Math.min(3, er?.vers_seuil || 0), proche = Math.min(5, er?.proximite || 0);
  $('pl-erreurs').hidden = !(er && actif);
  $('pl-erreurs-points').innerHTML = [0, 1, 2].map(i => '<li class="' + (i < vers ? 'plein' : '') + '"></li>').join('');
  $('pl-erreurs-points').setAttribute('aria-label', 'Erreurs sur cette énigme : ' + vers + ' sur 3 avant que l’entité s’approche');
  $('pl-proximite').innerHTML = [0, 1, 2, 3, 4].map(i => '<li class="' + (i < proche ? 'plein' : '') + '"></li>').join('');
  $('pl-proximite').setAttribute('aria-label', 'Proximité de l’entité : ' + proche + ' sur 5');
  const portes=prog?.portes;
  rendreAideReponse(prog);
  ov.classList.toggle('pl-choix-portes',!!portes);
  ov.classList.toggle('pl-fin',portes?.phase==='fin');
  rendreFin(portes);
  $('pl-portes').hidden=!portes;
  document.querySelector('.pl-conseil').hidden=true; // Consigne concrète dans l’aide ci-dessus.
  if(portes){
   const fin=portes.phase==='fin', vote=['vote','vote_2'].includes(portes.phase);
   const labels={attente:'Le débat va s’ouvrir',debat:'Le débat est ouvert',vote:'Vote secret',debat_egalite:'Égalité : nouveau débat',vote_2:'Second vote secret',fin:'La porte est ouverte'};
   $('pl-titre').textContent=fin?portes.resultat.texte:'Les cinq portes';
   $('pl-enonce').textContent=fin?'Le choix est fait. Voici ce que chacun cherchait à obtenir.':portes.registre_lie?'Vos découvertes ouvrent le registre des retours. Dans chaque tableau privé Telegram, choisissez la ligne correspondant au seuil identifié (II), au dernier lieu avant la Galerie (III) ou au dernier geste avant l’attente (IV). Cette ligne désigne une porte à écarter. Comparez vos déductions avant de voter.':'Une seule porte ramène Sally. Recoupez vos exclusions avant de choisir.';
   $('pl-erreurs').hidden=true;
   const restant=Math.max(0,Math.ceil((portes.jusqu-Date.now())/1000));
   $('pl-portes-phase').textContent=labels[portes.phase]+(vote?` — ${portes.votants}/${portes.total} ont voté`:['debat','debat_egalite'].includes(portes.phase)?` — ${portes.prets}/${portes.total} prêts`:'')+(portes.jusqu&&!fin?` — ${Math.floor(restant/60)}:${String(restant%60).padStart(2,'0')}`:'');
   const signes={Lune:'☾',Cendre:'⋰',Ronce:'♧',Verre:'◇',Seuil:'⊓'};
   const listePortes=$('pl-portes-liste'),vuePortes=JSON.stringify([portes.symboles,portes.candidats,!!fin,fin?portes.resultat.porte:null]);
   if(listePortes.dataset.vue!==vuePortes){
    listePortes.dataset.vue=vuePortes;
    listePortes.innerHTML=portes.symboles.map(s=>`<li class="${fin&&portes.resultat.porte===s?'choisie':''} ${!portes.candidats.includes(s)&&!fin?'hors-vote':''}"><span class="pl-porte-visuel" aria-hidden="true"><span class="pl-porte-repli">${signes[s]||''}</span><img src="assets/portes/porte-${encodeURIComponent(s.toLowerCase())}.png" alt="" width="1024" height="1536" decoding="async"></span><strong>${echapper(s)}</strong></li>`).join('');
   }
   $('pl-portes-consigne').textContent=fin?`Porte choisie : ${portes.resultat.porte}.`:vote?'Chacun écrit dans Telegram « je vote la porte de… », avec le nom de son choix.':'Comparez vos exclusions à voix haute. Chacun écrit ensuite « prêt à voter » dans Telegram.';
   $('pl-portes-fin').hidden=!fin;
   $('pl-portes-revelation').innerHTML=fin?(portes.revelation||[]).map(j=>`<li data-victoire="${j.victoire===true?'oui':'non'}"><strong>${echapper(j.prenom)}</strong> — ${echapper(j.role)}, ${echapper(j.camp==='mechant'?'méchant':j.camp)}${j.objectif?' ; objectif : '+echapper(j.objectif):''}<b>${j.victoire?'Victoire':'Défaite'}</b></li>`).join(''):'';
  }
  $('pl-carnet').hidden = !(prog?.carnet?.length);
  $('pl-carnet-liste').innerHTML = (prog?.carnet || []).map(e => `<li><span>${ROMAINS[e.etape - 1]}</span> ${echapper(e.titre)} <b>${echapper(e.reponse)}</b></li>`).join('');
  rendreDossierRetour(prog);
  $('pl-joueurs').innerHTML = (data?.joueurs || []).map(j => `<li>${echapper(j.prenom)}</li>`).join('');
  // Voix et ambiance.
  const liste = messages(), dernier = messageDe(etat.courant) || liste.at(-1);
  $('pl-etat-voix').textContent = etat.voixEnCours ? identiteAppel(messageDe(etat.courant)).nom+' parle…' : etat.absent ? 'Le fichier audio manque : lisez le texte.' : 'La maison écoute.';
  $('pl-etat-voix').classList.toggle('parle', etat.voixEnCours);
  $('pl-dock-titre').textContent = dernier.titre;
  const bouton = $('pl-rejouer'); bouton.dataset.etat = etat.voixEnCours ? 'lecture' : 'repos';
  bouton.querySelector('.pl-bouton-texte').textContent = etat.voixEnCours ? 'Arrêter la voix' : 'Réécouter';
  bouton.setAttribute('aria-label', etat.voixEnCours ? 'Arrêter la voix' : 'Réécouter : ' + dernier.titre);
  const musiqueBtn = $('pl-musique'); musiqueBtn.setAttribute('aria-pressed', String(etat.musiqueVoulue)); musiqueBtn.querySelector('.pl-bouton-texte').textContent = etat.musiqueVoulue ? 'Ambiance' : 'Ambiance coupée';
  $('pl-volume').value = String(etat.volume); $('pl-musique-niveau').value = String(etat.musiqueNiveau);
  // Appel entrant : sonne, se décroche, se raccroche. Rien ne se joue sans décrocher.
  const appel = etat.appel, appelMessage = appel ? messageDe(appel.id) : null;
  $('pl-appel').hidden = !appel;
  $('pl-appel').dataset.phase = appel?.phase || '';
  $('pl-appel').dataset.appelant=appelMessage?.appelant||'sally';
  $('pl-appel').dataset.conclusion=String(!!appelMessage?.id?.startsWith('conclusion-'));
  if(appel){
   const identite=identiteAppel(appelMessage);
   $('pl-appel').setAttribute('aria-label',identite.label);
   document.querySelector('.pl-appel-nom').textContent=identite.nom;
   document.querySelector('.pl-appel-visage span').textContent=identite.visage;
   $('pl-appel-etat').textContent = {sonne: 'Appel entrant', 'en-ligne': 'En ligne', termine: 'Appel terminé'}[appel.phase];
   $('pl-appel-sujet').textContent = appelMessage?.titre || '';
   $('pl-appel-ignorer').hidden = appel.phase !== 'sonne'; $('pl-appel-decrocher').hidden = appel.phase !== 'sonne'; $('pl-appel-raccrocher').hidden = appel.phase !== 'en-ligne';
   $('pl-appel-texte').hidden = appel.phase === 'sonne'; $('pl-appel-texte').textContent = etat.absent ? 'Le fichier audio manque. ' + etat.texteActuel : etat.texteActuel;
   $('pl-appel-onde').classList.toggle('parle', appel.phase === 'en-ligne' && etat.voixEnCours);
   rendreChrono();
  }
  $('pl-manques').hidden = !etat.manques.length || !!appel;
  $('pl-manques-texte').textContent = etat.manques.length > 1 ? `${etat.manques.length} appels manqués` : messageDe(etat.manques[0])?.appelant==='entite'?'Appel manqué de l’entité':'Appel manqué de Sally';
  $('pl-invite').hidden = etat.deverrouille || !!appel;
  $('pl-invite-texte').textContent = 'Touchez pour réveiller l’ambiance de la maison.';
  // Annonce d'un pouvoir révélé à la table, et mémoire des pouvoirs déjà révélés.
  const annonce = etat.annonceCourante, texteAnnonce = annonce ? TEXTES_ANNONCE[annonce.type] : null;
  $('pl-annonce').hidden = !texteAnnonce;
  if(texteAnnonce){
   $('pl-annonce-etiquette').textContent = texteAnnonce.etiquette || 'Un pouvoir se révèle';
   $('pl-annonce-titre').textContent = texteAnnonce.titre; $('pl-annonce-texte').textContent = texteAnnonce.texte;
   $('pl-annonce-fragment').hidden = !annonce.fragment; $('pl-annonce-fragment').textContent = annonce.fragment ? '« ' + annonce.fragment + ' »' : '';
   $('pl-annonce').dataset.type = annonce.type;
  }
  const gravures=data?.progression?.mur;
  $('pl-mur-ouvrir').hidden=!Array.isArray(gravures);
  $('pl-mur-ouvrir').textContent=`Le mur${gravures?.length?' — '+gravures.length+' voix':''}`;
  $('pl-mur').hidden=!Array.isArray(gravures);
  $('pl-mur-vide').hidden=!!gravures?.length;
  $('pl-mur-liste').innerHTML=(gravures||[]).map(g=>`<li><span>Énigme ${echapper(g.etape)}</span><blockquote>${echapper(g.texte)}</blockquote></li>`).join('');
  const revelations = etat.annonces.filter(a => TEXTES_ANNONCE[a.type]);
  $('pl-pouvoirs').hidden = !revelations.length;
  $('pl-pouvoirs-liste').innerHTML = revelations.map(a => `<li><strong>${echapper(TEXTES_ANNONCE[a.type].titre)}</strong>${a.fragment ? `<p>« ${echapper(a.fragment)} »</p>` : `<p>${echapper(TEXTES_ANNONCE[a.type].texte)}</p>`}</li>`).join('');
  $('pl-transcription').hidden = !(etat.voixEnCours || etat.absent) || !!appel;
  $('pl-transcription-texte').textContent = etat.texteActuel;
  $('pl-feuille-liste').innerHTML = liste.map(m => { const manque = etat.manques.includes(m.id);
   return `<li class="${m.id === etat.courant && etat.voixEnCours ? 'en-lecture' : ''}${manque ? ' manque' : ''}"><div><strong>${echapper(m.titre)}</strong>${manque ? '<em class="pl-badge">Appel manqué</em>' : ''}<p>${echapper(m.sources[0].texte)}</p></div><button type="button" data-message="${m.id}" aria-label="${manque ? 'Rappeler' : 'Réécouter'} : ${echapper(m.titre)}">${manque ? '☎ Rappeler' : '▶ Réécouter'}</button></li>`; }).join('');
 }
 // L'énoncé du serveur commence par le titre de l'affaire et une trace de la nuit : on garde le texte propre au sceau.
 function enonceCourt(texte){ const blocs = String(texte || '').split(/\n\n/); return (blocs.length > 1 ? blocs.slice(1).join('\n\n') : blocs[0]).replace(/\n?Chacun peut me demander[^\n]*$/m, '').trim(); }

 // --- Événements de la partie : accueil au premier affichage, un message à chaque sceau ouvert.
 function evenements(){
  if(!etat.ouvert || !etat.code) return;
  const fin=conclusion();
  if(fin){
   // La conclusion remplace un éventuel ancien appel et reste unique pour cette partie.
   if(!dejaJoue(fin.id)){
    if(etat.appel&&etat.appel.id!==fin.id){noterManque(etat.appel.id);arreterVoix();stopperMinuteries();etat.appel=null}
    appeler(fin.id);
   }
   return;
  }
  // Premier regard sur cette partie : on note combien de sceaux sont déjà ouverts, sans les annoncer.
  const cleVus = 'tu-etais-la-sceaux-' + etat.code, vus = lireSession(cleVus);
  if(vus === null) ecrireSession(cleVus, etat.resolues);
  if(!dejaJoue('accueil')){ appeler('accueil'); return; }
  if(vus !== null && etat.resolues > vus){ ecrireSession(cleVus, etat.resolues); appeler('sceau-' + etat.resolues); }
 }
 async function chargerAffaires(){ if(etat.affaires) return; try { const r = await fetch('catalogue-affaires.json', {cache: 'no-store'}); etat.affaires = r.ok ? await r.json() : []; } catch { etat.affaires = []; } rendre(); }
 function mettreAJour(data){
  etat.data = data;
  const partie = data?.partie;
  if(!partie || partie.statut !== 'en_cours'){ if(etat.ouvert) fermer(); etat.code = null; etat.appel = null; etat.manques = []; stopperMinuteries(); etat.erreurs = null; return; }
  if(etat.code !== partie.code){ etat.code = partie.code; etat.courant = null; etat.enAttente = null; etat.appel = null; stopperMinuteries(); etat.manques = lireManques(); clearTimeout(etat.minuterieAnnonce); etat.fileAnnonces=[]; etat.annonceCourante=null; etat.annonces=[]; }
  etat.resolues = data.progression?.resolues || 0;
  const er = data.progression?.erreurs;
  etat.erreurs = er && Number.isFinite(er.declenchements_total) ? er : null;
  suivreApproches();
  suivreMur();
  rendre(); evenements();
 }
 function ouvrir(){
  if(!etat.data?.partie || etat.data.partie.statut !== 'en_cours') return;
  etat.ouvert = true; chargerAffaires(); rendre(); demarrerMusique(); evenements(); surveillerPouvoirs();
  try { window.lirePouvoirs?.(); } catch {}
 }
 function fermer(){
  if($('pl-photo-dialog')?.open)$('pl-photo-dialog').close();
  if($('pl-plan-dialog')?.open)$('pl-plan-dialog').close();
  if($('pl-chemin-dialog')?.open)$('pl-chemin-dialog').close();
  if($('pl-retour-dialog')?.open)$('pl-retour-dialog').close();
  if(etat.appel?.phase === 'sonne') noterManque(etat.appel.id);
  etat.appel = null; stopperMinuteries(); etat.ouvert = false; arreterArchive(); arreterVoix(); arreterMusique();
  clearTimeout(etat.minuterieAnnonce); etat.annonceCourante = null; etat.fileAnnonces = []; surveillerPouvoirs(); rendre();
 }

 // --- Boutons.
 $('pl-fin-appel').addEventListener('click',()=>{const fin=conclusion();if(!fin)return;deverrouiller();if(etat.appel){arreterVoix();stopperMinuteries();etat.appel=null}appeler(fin.id)});
 $('pl-fin-details').addEventListener('click',()=>{const titre=$('pl-portes-fin').querySelector('h3');titre.setAttribute('tabindex','-1');titre.focus({preventScroll:true});titre.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})});
 $('pl-regie').addEventListener('click', fermer);
 $('pl-activer').addEventListener('click', deverrouiller);
 // Rappeler un appel manqué : on appelle Sally, elle répond tout de suite.
 function rappeler(id){
  deverrouiller(); stopperMinuteries(); retirerManque(id);
  etat.appel = {id, phase: 'en-ligne', debut: Date.now()}; etat.chrono = setInterval(rendreChrono, 500);
  $('pl-feuille').hidden = true; $('pl-voix').setAttribute('aria-expanded', 'false');
  jouer(id, false);
 }
 $('pl-appel-decrocher').addEventListener('click', decrocher);
 $('pl-appel-ignorer').addEventListener('click', () => ignorer(false));
 $('pl-appel-raccrocher').addEventListener('click', raccrocher);
 $('pl-manques').addEventListener('click', () => { const f = $('pl-feuille'); f.hidden = false; $('pl-voix').setAttribute('aria-expanded', 'true'); });
 $('pl-rejouer').addEventListener('click', () => { if(etat.appel?.phase === 'sonne') return; if(etat.voixEnCours){ arreterVoix(); rendre(); } else jouer(etat.courant || 'accueil', false); });
 $('pl-voix').addEventListener('click', () => { const f = $('pl-feuille'); f.hidden = !f.hidden; $('pl-voix').setAttribute('aria-expanded', String(!f.hidden)); });
 $('pl-feuille-fermer').addEventListener('click', () => { $('pl-feuille').hidden = true; $('pl-voix').setAttribute('aria-expanded', 'false'); });
 $('pl-mur-ouvrir').addEventListener('click',()=>{ $('pl-feuille').hidden=false; $('pl-voix').setAttribute('aria-expanded','true'); $('pl-mur').scrollIntoView({block:'start'}); $('pl-mur-titre').focus({preventScroll:true}); });
 $('pl-feuille-liste').addEventListener('click', e => {
  const b = e.target.closest('button[data-message]'); if(!b || etat.appel?.phase === 'sonne') return;
  deverrouiller(); if(etat.manques.includes(b.dataset.message)) rappeler(b.dataset.message); else jouer(b.dataset.message, false);
 });
 // Essai des bruits : pour juger à l'oreille ce que la maison peut faire entendre.
 // Les boutons montrent vos sons si effets.json existe, sinon les huit bruits de base, plus le verrou.
 async function boutonsBruits(){
  await listeEffets();
  const l = bruit.liste, noms = l ? [...new Set([...(l.debut || []), ...(l.milieu || []), ...(l.fin || []), ...(l.tous || [])])] : EFFETS;
  $('pl-bruits').innerHTML = [...(noms.length ? noms : EFFETS), 'sceau-ouvert', 'indice-decouvert', 'approche'].map(id => `<button type="button" data-bruit="${echapper(id)}">${echapper(id)}</button>`).join('');
 }
 boutonsBruits();
 $('pl-bruits').addEventListener('click', e => { const b = e.target.closest('button[data-bruit]'); if(b){ deverrouiller(); jouerEffet(b.dataset.bruit); } });
 $('pl-musique').addEventListener('click', () => {
  deverrouiller(); etat.musiqueVoulue = !etat.musiqueVoulue;
  try { localStorage.setItem('tu-etais-la-musique', etat.musiqueVoulue ? 'on' : 'off'); } catch {}
  if(etat.musiqueVoulue) demarrerMusique(); else arreterMusique();
  rendre();
 });
 $('pl-volume').addEventListener('input', e => { etat.volume = Number(e.target.value); try { localStorage.setItem('tu-etais-la-volume', String(etat.volume)); } catch {} regler(); });
 // Repère pour vérifier quelle version du plateau est chargée sur l'iPad (utile si le navigateur garde un ancien fichier).
 $('pl-musique-niveau').addEventListener('input', e => { etat.musiqueNiveau = Number(e.target.value); try { localStorage.setItem('tu-etais-la-musique-niveau', String(etat.musiqueNiveau)); } catch {} regler(); });
 if($('pl-version')) $('pl-version').textContent = 'Plateau version 27 : scènes préchargées, retour en haut et réglages du boîtier.';
 $('pl-annonce-fermer').addEventListener('click', masquerAnnonce);
 window.Plateau = {deverrouiller, ouvrir, fermer, mettreAJour, jouer, decrocher, annonces: recevoirAnnonces,
  delais: ms => { etat.delaiSonnerie = ms; },
  effet: jouerEffet, delaisEffets: d => { Object.assign(bruit.delais, d); programmerEffet(50); },
  rechargerEffets: () => { bruit.liste = undefined; bruit.buffers = {}; boutonsBruits(); },
  etat: () => ({deverrouille: etat.deverrouille, ouvert: etat.ouvert, voixEnCours: etat.voixEnCours, courant: etat.courant, musique: etat.musiqueVoulue, messages: messages().map(m => m.id), absent: etat.absent, enAttente: etat.enAttente, appel: etat.appel ? etat.appel.phase : null, appelId: etat.appel?.id || null, manques: [...etat.manques], sonnerie: etat.sonnerie, effets: [...bruit.joues], effetsPossibles: [...EFFETS], annonce: etat.annonceCourante?.id || null, revelations: etat.annonces.map(a => a.id)})};
})();
