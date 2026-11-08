'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronLeft,ChevronRight,X} from 'lucide-react';
import type {Content} from '@/lib/content';
import SectionPhoto from './section-photo';
import {usePreferences} from './preferences';

export default function AboutGallery({photos}:{photos:Content['photos']}){
 const {locale}=usePreferences(),en=locale==='en';
 const [selected,setSelected]=useState<number|null>(null);
 const [closing,setClosing]=useState(false);
 const closeButton=useRef<HTMLButtonElement>(null);
 const opener=useRef<HTMLButtonElement|null>(null);
 const exitTimer=useRef<number|null>(null);
 const close=()=>{
  if(closing)return;
  setClosing(true);
  exitTimer.current=window.setTimeout(()=>{setSelected(null);setClosing(false);opener.current?.focus({preventScroll:true})},260);
 };
 const step=(direction:number)=>setSelected(current=>current===null?null:(current+direction+photos.length)%photos.length);
 useEffect(()=>()=>{if(exitTimer.current!==null)window.clearTimeout(exitTimer.current)},[]);
 useEffect(()=>{
  if(selected===null)return;
  closeButton.current?.focus({preventScroll:true});
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close()}
   if(event.key==='ArrowLeft'){event.preventDefault();step(-1)}
   if(event.key==='ArrowRight'){event.preventDefault();step(1)}
  };
  window.addEventListener('keydown',key,true);
  return()=>window.removeEventListener('keydown',key,true);
 },[selected,photos.length]);
 return <><div className="gallery">{photos.map((photo,index)=><button className="gallery-thumb" type="button" key={photo.id+photo.src} aria-label={en?`Enlarge photo ${index+1}`:`Zvětšit fotografii ${index+1}`} onClick={event=>{opener.current=event.currentTarget;setClosing(false);setSelected(index)}}><SectionPhoto src={photo.src} alt={photo.alt} focus={photo.focus} eager={index<2}/></button>)}</div>
  {selected!==null && createPortal(<div className={'gallery-viewer'+(closing?' is-closing':'')} role="dialog" aria-modal="true" aria-label={en?'Photo gallery':'Galerie fotografií'} onClick={event=>{if(event.target===event.currentTarget)close()}} onKeyDown={event=>{event.stopPropagation();if(event.key==='Tab'){const buttons=Array.from(event.currentTarget.querySelectorAll('button'));const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}}}>
   <button ref={closeButton} className="gallery-control gallery-close" type="button" aria-label={en?'Close gallery':'Zavřít galerii'} onClick={close}><X/></button>
   {photos.length>1&&<button className="gallery-control gallery-previous" type="button" aria-label={en?'Previous photo':'Předchozí fotografie'} onClick={()=>step(-1)}><ChevronLeft/></button>}
   <img className="gallery-large" key={photos[selected].src} src={photos[selected].src} alt={photos[selected].alt} decoding="async"/>
   {photos.length>1&&<button className="gallery-control gallery-next" type="button" aria-label={en?'Next photo':'Další fotografie'} onClick={()=>step(1)}><ChevronRight/></button>}
  </div>,document.body)}
 </>;
}
