'use client';
import {useCallback,useLayoutEffect,useState} from 'react';

export function useMobileReveal(){
 // The initial SSR attribute starts the CSS reveal without a hydration flash.
 // CSS also completes it if JavaScript is unavailable.
 const [revealing,setRevealing]=useState(true);
 const finishReveal=useCallback(()=>setRevealing(false),[]);
 useLayoutEffect(()=>{
  const mobile=matchMedia('(max-width: 1000px)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!mobile.matches||reduced.matches||location.hash){finishReveal();return;}
  // Remove animation/filter layers once the last row has arrived at 1400 ms.
  const timer=setTimeout(finishReveal,1500);
  const changed=()=>{if(!mobile.matches||reduced.matches)finishReveal()};
  const restored=(event:PageTransitionEvent)=>{if(event.persisted)finishReveal()};
  mobile.addEventListener('change',changed);
  reduced.addEventListener('change',changed);
  addEventListener('pageshow',restored);
  return()=>{clearTimeout(timer);mobile.removeEventListener('change',changed);reduced.removeEventListener('change',changed);removeEventListener('pageshow',restored)};
 },[finishReveal]);
 return {revealing,finishReveal};
}

export function useMenuReturn(active:string|null,requested:string|null){
 const [returningSection,setReturningSection]=useState<string|null>(null);
 const finishReturn=useCallback(()=>setReturningSection(null),[]);
 useLayoutEffect(()=>{
  if(requested){finishReturn();return;}
  if(active&&matchMedia('(max-width: 1000px)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches)setReturningSection(active);
 },[active,requested,finishReturn]);
 useLayoutEffect(()=>{
  if(!returningSection)return;
  const mobile=matchMedia('(max-width: 1000px)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const changed=()=>{if(!mobile.matches||reduced.matches)finishReturn()};
  changed();
  // Keep other tiles hidden while the panel shrinks. Reveal all of them together
  // 300 ms after it has closed, then remove the temporary filter layers.
  const timer=active?undefined:setTimeout(finishReturn,1000);
  mobile.addEventListener('change',changed);reduced.addEventListener('change',changed);
  return()=>{clearTimeout(timer);mobile.removeEventListener('change',changed);reduced.removeEventListener('change',changed)};
 },[active,returningSection,finishReturn]);
 return {returningSection,finishReturn};
}
