import React,{useLayoutEffect} from 'react';
import {hydrateRoot,createRoot} from 'react-dom/client';
import Reception from '../app/reception';
import AdminEditor from '../app/admin/editor';
import Setup from '../app/admin/setup';
const boot=JSON.parse(document.getElementById('bootstrap')!.textContent!);
const root=document.getElementById('root')!;
function Mounted({children}:{children:React.ReactNode}){
 useLayoutEffect(()=>{
  document.documentElement.classList.remove('forpsi-booting');
  clearTimeout((window as Window&{zubyBootTimer?:number}).zubyBootTimer);
 },[]);
 return children;
}
const mount=(element:React.ReactNode)=>boot.mount?createRoot(root).render(<Mounted>{element}</Mounted>):hydrateRoot(root,element);
if(boot.page==='home')mount(<Reception data={boot.data} initialLocale={boot.locale} initialConsent={boot.consent}/>);
if(boot.page==='editor')mount(<AdminEditor/>);
if(boot.page==='setup')mount(<Setup/>);
