'use client';
import {useCallback,useEffect,useRef,type PointerEvent} from 'react';
import {ArrowUpRight,type LucideIcon} from 'lucide-react';

type Props={id:string,name:string,Icon:LucideIcon,disabled:boolean,onOpen:(id:string)=>void};
export default function GlassTile({id,name,Icon,disabled,onOpen}:Props){
 const tile=useRef<HTMLAnchorElement>(null);
 const media=useRef<MediaQueryList|null>(null);
 const frame=useRef(0);
 const bounds=useRef<DOMRect|null>(null);
 const pointer=useRef({x:0,y:0});
 const reset=useCallback((snap=false)=>{
  cancelAnimationFrame(frame.current);frame.current=0;bounds.current=null;
  const el=tile.current;if(!el)return;
  el.dataset.tilting='false';el.dataset.snap=String(snap);
  for(const [name,value] of [['--tilt-x','0deg'],['--tilt-y','0deg'],['--layer-x','0px'],['--layer-y','0px']])el.style.setProperty(name,value);
 },[]);
 useEffect(()=>{
  const query=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  media.current=query;
  const stop=()=>reset(true);
  query.addEventListener('change',stop);
  window.addEventListener('blur',stop);
  window.addEventListener('resize',stop);
  document.addEventListener('visibilitychange',stop);
  return()=>{cancelAnimationFrame(frame.current);query.removeEventListener('change',stop);window.removeEventListener('blur',stop);window.removeEventListener('resize',stop);document.removeEventListener('visibilitychange',stop)};
 },[reset]);
 useEffect(()=>{if(disabled)reset(true)},[disabled,reset]);
 function move(event:PointerEvent<HTMLAnchorElement>){
  if(disabled||event.pointerType!=='mouse'||event.buttons||!media.current?.matches)return;
  const el=tile.current!;
  bounds.current??=el.getBoundingClientRect();
  pointer.current={x:event.clientX,y:event.clientY};
  if(frame.current)return;
  // Batch pointer events to one compositor update; no React renders per move.
  frame.current=requestAnimationFrame(()=>{
   frame.current=0;const box=bounds.current;if(!box)return;
   const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
   const x=clamp((pointer.current.x-box.left)/box.width*2-1);
   const y=clamp((pointer.current.y-box.top)/box.height*2-1);
   const angle=1.2/Math.max(1,Math.hypot(x,y));
   el.dataset.snap='false';el.dataset.tilting='true';
   el.style.setProperty('--tilt-x',(-y*angle).toFixed(3)+'deg');
   el.style.setProperty('--tilt-y',(x*angle).toFixed(3)+'deg');
   el.style.setProperty('--layer-x',(x*1.4).toFixed(3)+'px');
   el.style.setProperty('--layer-y',(y*1.4).toFixed(3)+'px');
  });
 }
 return <a ref={tile} id={'tile-'+id} href={'#'+id} aria-haspopup="dialog"
  className={'tile '+(id==='objednani'?'booking':'')}
  onPointerEnter={move} onPointerMove={move} onPointerLeave={()=>reset()}
  onPointerCancel={()=>reset(true)} onBlur={()=>reset()}
  onClick={e=>{e.preventDefault();reset(true);onOpen(id)}}>
  <span className="tile-glass" aria-hidden="true"/>
  <Icon className="tile-icon" aria-hidden="true"/>
  <span className="tile-label">{name}</span>
  <ArrowUpRight className="tile-arrow" aria-hidden="true"/>
 </a>;
}
