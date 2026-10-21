window.gameAudio=(()=>{
 let connection;
 function open(){return connection??=new Promise((resolve,reject)=>{const request=indexedDB.open('tu-etais-la-audio',1);request.onupgradeneeded=()=>request.result.createObjectStore('recordings',{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
 async function transaction(mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('recordings',mode),request=action(tx.objectStore('recordings'));tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Stockage interrompu'))})}
 return {all:()=>transaction('readonly',store=>store.getAll()),put:record=>transaction('readwrite',store=>store.put(record))};
})();
