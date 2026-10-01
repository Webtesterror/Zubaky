'use client';
import {useCallback,useLayoutEffect,useState} from 'react';

export function useMobileReveal(){
 // The initial SSR attribute starts the CSS reveal without a hydration flash.
 // CSS also completes it if JavaScript is unavailable.
 const [revealing,setRevealing]=useState(true);
 const finishReveal=useCallback(()=>setRevealing(false),[]);
 useLayoutEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||location.hash){finishReveal();return;}
  // Remove the shared compositor layer just after the 1000 + 1250 ms reveal.
  const timer=setTimeout(finishReveal,2350);
  const changed=()=>{if(reduced.matches)finishReveal()};
  const restored=(event:PageTransitionEvent)=>{if(event.persisted)finishReveal()};
  reduced.addEventListener('change',changed);
  addEventListener('pageshow',restored);
  return()=>{clearTimeout(timer);reduced.removeEventListener('change',changed);removeEventListener('pageshow',restored)};
 },[finishReveal]);
 return {revealing,finishReveal};
}
