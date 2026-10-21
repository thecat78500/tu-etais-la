'use strict';
// QR d'inscription uniquement : jamais de lien organisateur ou de clé d'écran.
window.InvitationQR={render(container,url){
 if(!/^https:\/\/t\.me\/tu_etais_la_maison_bot\?start=M[A-Z0-9]{7}$/.test(url))throw Error('Lien d’inscription invalide');
 if(typeof qrcode!=='function')throw Error('Générateur QR indisponible');
 if(container.dataset.url===url&&container.firstElementChild)return;
 const code=qrcode(0,'M');code.addData(url,'Byte');code.make();
 const modules=code.getModuleCount(),marge=4,taille=modules+marge*2,ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${taille} ${taille}`);svg.setAttribute('width','256');svg.setAttribute('height','256');svg.setAttribute('role','img');svg.setAttribute('aria-label','QR code : rejoindre la partie '+url.split('=')[1]);svg.setAttribute('shape-rendering','crispEdges');
 const fond=document.createElementNS(ns,'rect');fond.setAttribute('width',String(taille));fond.setAttribute('height',String(taille));fond.setAttribute('fill','#fff');svg.append(fond);
 const pixels=[];for(let y=0;y<modules;y++)for(let x=0;x<modules;x++)if(code.isDark(y,x))pixels.push(`M${x+marge},${y+marge}h1v1h-1z`);
 const trace=document.createElementNS(ns,'path');trace.setAttribute('d',pixels.join(''));trace.setAttribute('fill','#000');svg.append(trace);container.replaceChildren(svg);container.dataset.url=url;
}};
