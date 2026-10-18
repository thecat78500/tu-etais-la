/* Bibliothèque locale partagée par l’iPad et sa page de préparation. */
window.gameMedia = (()=>{
 let connection;
 const open=()=>connection??=new Promise((resolve,reject)=>{
  const request=indexedDB.open('tu-etais-la-media',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('images',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
 async function run(mode,action){const db=await open();return new Promise((resolve,reject)=>{
  const tx=db.transaction('images',mode),request=action(tx.objectStore('images'));
  tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Enregistrement interrompu.'));
 });}
 return {all:()=>run('readonly',store=>store.getAll()),put:record=>run('readwrite',store=>store.put(record))};
})();
