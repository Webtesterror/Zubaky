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
 const words=shown.text.trim().split(/\s+/);
 const multiword=words.length>1;
 useLayoutEffect(()=>{
  const label=labelRef.current;
  const tile=label?.closest<HTMLElement>('.tile');
  if(!label||!tile)return;
  const mobile=matchMedia('(max-width: 1000px)');
  let active=true;
  const measure=()=>{
   if(!mobile.matches||multiword){tile.classList.remove('has-overflowing-label');setOverflowing(false);return}
   const tileStyle=getComputedStyle(tile);
   const available=tile.clientWidth-parseFloat(tileStyle.paddingLeft)-parseFloat(tileStyle.paddingRight);
   const previous=label.style.cssText;
   label.style.cssText+=';position:absolute;display:block;width:max-content;max-width:none;white-space:nowrap;transform:none;visibility:hidden';
   const naturalWidth=label.getBoundingClientRect().width;
   label.style.cssText=previous;
   const next=naturalWidth>available+1;
   tile.classList.toggle('has-overflowing-label',next);
   if(active)setOverflowing(next);
  };
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(tile);
  mobile.addEventListener('change',measure);
  void document.fonts?.ready.then(()=>{if(active)measure()});
  return()=>{active=false;tile.classList.remove('has-overflowing-label');observer.disconnect();mobile.removeEventListener('change',measure)};
 },[shown.text,shown.locale,multiword]);
 return <span ref={labelRef} className={'tile-label'+(blurred?' is-blurred':'')+(multiword?' is-multiword':'')+(overflowing?' is-overflowing':'')} lang={shown.locale} aria-hidden="true">{multiword?words.join('\n'):shown.text}</span>;
}
