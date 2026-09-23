'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import type {Locale} from '@/lib/preferences';

export default function TileLabel({text,locale}:{text:string,locale:Locale}){
 const current=useRef({text,locale});
 const [shown,setShown]=useState(current.current),[blurred,setBlurred]=useState(false);
 useLayoutEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const show=()=>{current.current={text,locale};setShown(current.current);setBlurred(false)};
  if(reduced.matches||current.current.text===text){show();return;}
  // Keep the old label until it is blurred, then sharpen the new translation.
  setBlurred(true);
  const timer=setTimeout(show,160);
  const changed=()=>{if(reduced.matches){clearTimeout(timer);show()}};
  reduced.addEventListener('change',changed);
  return()=>{clearTimeout(timer);reduced.removeEventListener('change',changed)};
 },[text,locale]);
 return <span className={'tile-label'+(blurred?' is-blurred':'')} lang={shown.locale} aria-hidden="true"><span className="text-backing">{shown.text}</span></span>;
}
