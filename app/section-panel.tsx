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
 const currentOpacity=useRef(1);
 const revealed=useRef(false);
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
  const startOpacity=exiting?currentOpacity.current:.06;
  let animation:Animation|undefined,timer:ReturnType<typeof setTimeout>|undefined,cancelled=false,finished=false;
  const fadeContent=exiting&&revealed.current;
  if(!exiting){revealed.current=true;setVisible(true)}
  p.focus({preventScroll:true});
  s.style.transform=start;
  s.style.opacity=String(startOpacity);
  s.style.willChange='transform, opacity';

  const finish=()=>{
   if(cancelled||finished)return;
   finished=true;
   currentTransform.current=exiting?tileTransform:expanded;
   s.style.transform=currentTransform.current;
   currentOpacity.current=exiting?0:1;
   s.style.opacity=String(currentOpacity.current);
   s.style.willChange='auto';
   animation?.cancel();
   if(exiting)onExited();
   else{revealed.current=true;setVisible(true)}
  };
  // Only the glass surface scales. Text and photos render at their final size
  // and fade in concurrently, without waiting for the surface animation.
  const startMotion=()=>{
   if(exiting){revealed.current=false;setVisible(false)}
    animation=s.animate([
     {transform:start,opacity:startOpacity},
     {transform:exiting?tileTransform:expanded,opacity:exiting?0:1},
    ],{duration:exiting?300:480,easing:exiting?'cubic-bezier(.4,0,.2,1)':'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    animation.finished.then(finish,()=>{});
  };
  if(motion.matches||!s.animate)finish();
  else if(fadeContent)timer=setTimeout(startMotion,80);
  else startMotion();
  const skipMotion=()=>{if(motion.matches){clearTimeout(timer);finish();animation?.cancel()}};
  motion.addEventListener('change',skipMotion);
  return()=>{
   // Preserve progress if Back/Escape interrupts an opening animation.
   if(!finished){const style=getComputedStyle(s);currentTransform.current=style.transform;currentOpacity.current=Number(style.opacity)}
   cancelled=true;
   clearTimeout(timer);
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
   <div className="panel-morph panel-surface" ref={shell} aria-hidden="true"/>
   <>
    <header className="panel-head" inert={!visible} aria-hidden={!visible}><div><div className="eyebrow">Zuby | Dásně</div><h2>{title}</h2></div>
     <button className="close" ref={closeButton} aria-label={t("Zavřít sekci")} onClick={()=>{if(!exiting)onClose()}}><X size={23}/></button>
    </header>
    <div className="panel-scroll" inert={!visible} aria-hidden={!visible}>{renderContent()}</div>
   </>
  </div>
 </>;
}
