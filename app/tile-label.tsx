'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import type {Locale} from '@/lib/preferences';

export default function TileLabel({text,locale}:{text:string,locale:Locale}){
 const current=useRef({text,locale});
 const labelRef=useRef<HTMLSpanElement>(null);
 const [shown,setShown]=useState(current.current),[blurred,setBlurred]=useState(false),[overflowing,setOverflowing]=useState(false);
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
 useLayoutEffect(()=>{
  const label=labelRef.current;
  const tile=label?.closest<HTMLElement>('.tile');
  if(!label||!tile)return;
  const mobile=matchMedia('(max-width: 1000px)');
  let active=true;
  const measure=()=>{
   if(!mobile.matches){setOverflowing(false);return}
   const tileStyle=getComputedStyle(tile);
   const available=tile.clientWidth-parseFloat(tileStyle.paddingLeft)-parseFloat(tileStyle.paddingRight);
   const previous=label.style.cssText;
   label.style.cssText+=';position:absolute;display:block;width:max-content;max-width:none;white-space:nowrap;transform:none;visibility:hidden';
   const naturalWidth=label.getBoundingClientRect().width;
   label.style.cssText=previous;
   if(active)setOverflowing(naturalWidth>available+1);
  };
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(tile);
  mobile.addEventListener('change',measure);
  void document.fonts?.ready.then(()=>{if(active)measure()});
  return()=>{active=false;observer.disconnect();mobile.removeEventListener('change',measure)};
 },[shown.text,shown.locale]);
 return <span ref={labelRef} className={'tile-label'+(blurred?' is-blurred':'')+(overflowing?' is-overflowing':'')} lang={shown.locale} aria-hidden="true">{shown.text}</span>;
}
