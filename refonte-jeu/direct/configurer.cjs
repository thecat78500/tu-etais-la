'use strict';
// Transporte la clé interne chiffrée : la clé privée de déchiffrement reste sur le serveur.
const fs=require('fs'),crypto=require('crypto');
const b=JSON.parse(Buffer.from(process.argv[2]||'','base64').toString('utf8'));
const prive=crypto.createPrivateKey(fs.readFileSync('/tmp/jeu-direct-install.pem'));
const publicLocal=crypto.createPublicKey({key:Buffer.from(b.pub,'base64'),type:'spki',format:'der'});
const cle=crypto.createHash('sha256').update(crypto.diffieHellman({privateKey:prive,publicKey:publicLocal})).digest();
const decrypt=crypto.createDecipheriv('aes-256-gcm',cle,Buffer.from(b.iv,'base64'));decrypt.setAuthTag(Buffer.from(b.tag,'base64'));
const secret=Buffer.concat([decrypt.update(Buffer.from(b.contenu,'base64')),decrypt.final()]).toString('utf8');
if(!/^[a-f0-9]{64}$/.test(secret))throw Error('Configuration refusée.');
const fichier='/etc/tu-etais-la-direct.env';
if(fs.existsSync(fichier))fs.copyFileSync(fichier,fichier+'.avant');
fs.writeFileSync(fichier,'JEU_DIRECT_SECRET='+secret+'\nN8N_URL=http://127.0.0.1:5678\nPORT=8790\nHOST=0.0.0.0\n',{mode:0o600});
console.log('Configuration chiffrée reçue. Aucune clé affichée.');
