// Prépare les textes pour l’enregistrement ; aucun appel API, aucun fichier audio généré.
const fs=require('node:fs');
const path=require('node:path');
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,'clips.json'),'utf8'));
for(const clip of pack.clips){
 if(!/^[a-z0-9-]+$/.test(clip.id))throw Error('Identifiant incorrect');
 fs.writeFileSync(path.join(__dirname,clip.id+'.txt'),clip.text+'\n','utf8');
}
const rows=pack.clips.map(clip=>`| ${clip.id}.mp3 | ${clip.voice} | ${clip.channel==='ipad_public'?'iPad — groupe':'Telegram — privé'} | ${clip.stage} | ${clip.target_seconds.join('–')} s |`).join('\n');
const scripts=pack.clips.map(clip=>`## ${clip.id}.mp3\n\n**Voix :** ${clip.voice}. **Étape :** ${clip.stage}. **Durée visée :** ${clip.target_seconds.join('–')} secondes.\n\n**Diffusion :** ${clip.channel==='ipad_public'?'iPad, pour tout le groupe':`Telegram privé ; destinataire : ${clip.role==='any_balanced_rotation'?'un joueur de n’importe quel camp, selon la programmation':clip.role}`}.\n\n**Déclenchement :** \`${clip.trigger}\`.\n\n**Direction :** ${clip.direction}\n\n> ${clip.text}\n\n**Texte seul pour l’enregistrement :** [${clip.id}.txt](${clip.id}.txt)\n`).join('\n');
fs.writeFileSync(path.join(__dirname,'SCRIPTS-ENREGISTREMENT.md'),`# Scripts audio — ${pack.scenario}\n\nDix textes prêts à enregistrer. Les MP3 n’existent pas encore. Durées indicatives à ajuster lors de l’enregistrement. Les noms ci-dessous sont les noms attendus des futurs fichiers audio.\n\n| Fichier à produire | Voix | Diffusion | Énigme | Durée visée |\n|---|---|---|---|---|\n${rows}\n\n${scripts}`,'utf8');
console.log(`${pack.clips.length} textes et un livret préparés. Aucun audio généré.`);
