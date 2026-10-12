// Public bootstrap only; secrets and password hashes never reach the browser.
export function backendConfig():{backend?:string,csrf?:string,adminPath?:string}{
 if(typeof document==='undefined')return {};
 try{return JSON.parse(document.getElementById('bootstrap')?.textContent||'{}')}catch{return {}}
}
export function adminFetch(url:string,init:RequestInit={}){
 const headers=new Headers(init.headers),token=backendConfig().csrf;
 if(token)headers.set('X-CSRF-Token',token);
 return fetch(url,{...init,headers});
}
