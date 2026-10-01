'use client';
import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {X} from 'lucide-react';
import {usePreferences} from './preferences';

type Props={id:string,title:string,exiting:boolean,onClose:()=>void,onExited:()=>void,renderContent:()=>ReactNode};

export default function SectionPanel({id,title,exiting,onClose,onExited,renderContent}:Props){
 const {t}=usePreferences();
 const panel=useRef<HTMLDivElement>(null);
 const shell=useRef<HTMLDivElement>(null);
 const closeButton=useRef<HTMLButtonElement>(null);
 const currentTransform=useRef<string|null>(null);
 const [visible,setVisible]=useState(false);

 useLayoutEffect(()=>{
  const p=panel.current!,s=shell.current!;
  const tile=document.getElementById('tile-'+id);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const target=p.getBoundingClientRect(),origin=tile?.getBoundingClientRect();
  const tileTransform=origin
   ?`translate3d(${origin.left-target.left}px,${origin.top-target.top}px,0) scale(${origin.width/target.width},${origin.height/target.height})`
   :'scale(.97)';
  const expanded='translate3d(0,0,0) scale(1,1)';
  const start=exiting?(currentTransform.current??expanded):tileTransform;
  let animation:Animation|undefined,hideTimer:ReturnType<typeof setTimeout>|undefined,cancelled=false,finished=false;
  if(!exiting)setVisible(true);
  p.focus({preventScroll:true});
  s.style.transform=start;
  s.style.opacity='1';
  s.style.willChange='transform, opacity';

  const finish=()=>{
   if(cancelled||finished)return;
   finished=true;
   currentTransform.current=exiting?tileTransform:expanded;
   s.style.transform=currentTransform.current;
   s.style.opacity='0';
   s.style.willChange='auto';
   animation?.cancel();
   if(exiting)onExited();
   else setVisible(true);
  };
  // Only the glass surface scales. Text and photos render at their final size
  // and fade in concurrently, without waiting for the surface animation.
  const startMotion=()=>{
   // Start the reverse morph immediately. Content completes its short fade
   // independently, instead of delaying the entire closing motion by 80 ms.
   if(exiting)hideTimer=setTimeout(()=>setVisible(false),80);
    animation=s.animate([
     {transform:start,opacity:1},
     {transform:exiting?tileTransform:expanded,opacity:0},
    ],{duration:exiting?300:576,easing:exiting?'cubic-bezier(.4,0,.2,1)':'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    animation.finished.then(finish,()=>{});
  };
  if(motion.matches||!s.animate)finish();
  else startMotion();
  const skipMotion=()=>{if(motion.matches){clearTimeout(hideTimer);finish();animation?.cancel()}};
  motion.addEventListener('change',skipMotion);
  return()=>{
   // Preserve progress if Back/Escape interrupts an opening animation.
   if(!finished)currentTransform.current=getComputedStyle(s).transform;
   cancelled=true;
   clearTimeout(hideTimer);
   animation?.cancel();
   motion.removeEventListener('change',skipMotion);
   s.style.willChange='auto';
  };
 },[id,exiting,onExited]);

 useLayoutEffect(()=>{if(visible)closeButton.current?.focus({preventScroll:true})},[visible]);

 return <>
  <div className={'veil'+(exiting?' is-closing':'')} aria-hidden="true" onClick={e=>{if(e.target===e.currentTarget&&!exiting)onClose()}}/>
  <div className={'panel'+(visible?' is-open':' is-morphing')+(exiting?' is-closing':'')} ref={panel}
   role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
   onKeyDown={e=>{
    if(e.key==='Escape'){e.preventDefault();if(!exiting)onClose()}
    if(e.key==='Tab'){
     const nodes=Array.from(panel.current!.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),iframe,[tabindex="0"]')).filter(n=>n.getClientRects().length>0);
     const first=nodes[0],last=nodes[nodes.length-1];
     if(!first){e.preventDefault();panel.current?.focus({preventScroll:true});return}
     if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last.focus()}
     else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===panel.current)){e.preventDefault();first.focus()}
    }
   }}>
   <div className="panel-morph" ref={shell} aria-hidden="true"/>
   <div className="panel-surface" aria-hidden="true"/>
   <>
    <header className="panel-head" inert={!visible} aria-hidden={!visible}><div><div className="eyebrow">Zuby | Dásně</div><h2>{title}</h2></div>
     <button className="close" ref={closeButton} aria-label={t("Zavřít sekci")} onClick={()=>{if(!exiting)onClose()}}><X size={23}/></button>
    </header>
    <div className="panel-scroll" inert={!visible} aria-hidden={!visible}>{renderContent()}</div>
   </>
  </div>
 </>;
}
