'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import manifest from '@/lib/image-manifest.json';
const images:Record<string,{width:number,height:number,variants:{src:string,width:number}[]}>=manifest;
export default function SectionPhoto({src,alt,focus,eager=false,portrait=false}:{src:string,alt:string,focus:number,eager?:boolean,portrait?:boolean}){
 const entry=images[src],variants=entry?.variants;
 const image=useRef<HTMLImageElement>(null);
 const [loaded,setLoaded]=useState(false);
 useLayoutEffect(()=>{setLoaded(!!image.current?.complete)},[src]);
 return <span className={'section-photo'+(portrait?' is-portrait':'')} data-loaded={loaded}>
  <img ref={image} src={variants?.find(v=>v.width===960)?.src??src}
   srcSet={variants?.map(v=>`${v.src} ${v.width}w`).join(', ')}
   sizes={portrait?'(max-width: 700px) calc(100vw - 64px), 410px':'(max-width: 700px) calc(100vw - 64px), (max-width: 1500px) 42vw, 610px'}
   width={entry?.width} height={entry?.height} alt={alt} loading={eager?'eager':'lazy'} decoding="async"
   onLoad={()=>setLoaded(true)} onError={()=>setLoaded(true)} style={{objectPosition:`50% ${focus}%`}}/>
 </span>;
}
