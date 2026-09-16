'use client';
import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {X} from 'lucide-react';

type Props={id:string,title:string,exiting:boolean,onClose:()=>void,onExited:()=>void,renderContent:()=>ReactNode};

export default function SectionPanel({id,title,exiting,onClose,onExited,renderContent}:Props){
 const panel=useRef<HTMLDivElement>(null);
 const shell=useRef<HTMLDivElement>(null);
 const closeButton=useRef<HTMLButtonElement>(null);
 const currentTransform=useRef<string|null>(null);
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
  let animation:Animation|undefined,frame=0,timer:ReturnType<typeof setTimeout>|undefined,cancelled=false,finished=false;
  const fadeContent=exiting&&revealed.current;
  if(!exiting){revealed.current=false;setVisible(false)}
  p.focus({preventScroll:true});
  s.style.transform=start;
  s.style.willChange='transform, opacity';

  const finish=()=>{
   if(cancelled||finished)return;
   finished=true;
   currentTransform.current=exiting?tileTransform:expanded;
   s.style.transform=currentTransform.current;
   s.style.willChange='auto';
   if(exiting)onExited();
   else{revealed.current=true;setVisible(true)}
  };
  // Only a flat, empty surface moves. Photos, text and backdrop blur stay out
  // of the scaled layer, so the compositor can reuse the same small texture.
  const startMotion=()=>{
   if(exiting){revealed.current=false;setVisible(false)}
   frame=requestAnimationFrame(()=>{
    animation=s.animate([
     {transform:start,opacity:1},
     {transform:exiting?tileTransform:expanded,opacity:exiting?0:1},
    ],{duration:exiting?300:420,easing:exiting?'cubic-bezier(.4,0,.2,1)':'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    animation.finished.then(finish,()=>{});
   });
  };
  if(motion.matches||!s.animate)finish();
  else if(fadeContent)timer=setTimeout(startMotion,80);
  else startMotion();
  const skipMotion=()=>{if(motion.matches){clearTimeout(timer);cancelAnimationFrame(frame);finish();animation?.cancel()}};
  motion.addEventListener('change',skipMotion);
  return()=>{
   // Preserve progress if Back/Escape interrupts an opening animation.
   if(!finished)currentTransform.current=getComputedStyle(s).transform;
   cancelled=true;
   clearTimeout(timer);
   cancelAnimationFrame(frame);
   animation?.cancel();
   motion.removeEventListener('change',skipMotion);
   s.style.willChange='auto';
  };
 },[id,exiting,onExited]);

 useLayoutEffect(()=>{if(visible)closeButton.current?.focus({preventScroll:true})},[visible]);

 return <>
  <div className={'veil'+(exiting?' is-closing':'')} aria-hidden="true"/>
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
   {visible&&<>
    <div className="panel-surface" aria-hidden="true"/>
    <header className="panel-head"><div><div className="eyebrow">Zuby | Dásně</div><h2>{title}</h2></div>
     <button className="close" ref={closeButton} aria-label="Zavřít sekci" onClick={()=>{if(!exiting)onClose()}}><X size={23}/></button>
    </header>
    <div className="panel-scroll">{renderContent()}</div>
   </>}
  </div>
 </>;
}
