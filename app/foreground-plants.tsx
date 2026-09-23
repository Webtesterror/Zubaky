'use client';
import {useLayoutEffect,useState} from 'react';
// The original photo is reused through a green-channel alpha mask: no replacement
// leaves, approximate silhouette, or second independently cropped photograph.
export default function ForegroundPlants(){
 const [viewport,setViewport]=useState({w:0,h:0});
 useLayoutEffect(()=>{const sync=()=>setViewport({w:window.innerWidth,h:window.innerHeight});sync();window.addEventListener('resize',sync);return()=>window.removeEventListener('resize',sync)},[]);
 const geometry=(wide:boolean)=>{const width=Math.max(viewport.w,viewport.h*(wide?4/3:1)),height=width/(wide?4/3:1);return {width,height,x:(viewport.w-width)*(viewport.w<=700?.08:.5),y:(viewport.h-height)*(viewport.w<=700?.5:.28)}};
 if(!viewport.w)return null;
 return <div className="foreground-plants" aria-hidden="true">
  {[{id:'square',src:'/recepce-fotografie-2k.webp',viewBox:'0 0 2048 2048'},{id:'wide',src:'/recepce-wide.webp',viewBox:'0 0 2560 1920'}].map(({id,src,viewBox})=><svg key={id} className={'foliage-view foliage-'+id} width="100%" height="100%">
   <defs>
    <filter id={'leaf-alpha-'+id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
     <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -8 16 -8 0 -.3"/>
     <feComponentTransfer><feFuncA type="linear" slope="10" intercept="-.1"/></feComponentTransfer>
    </filter>
    <mask id={'leaf-mask-'+id} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%" style={{maskType:'alpha'}}>
     <svg className="foliage-photo" {...geometry(id==='wide')} viewBox={viewBox} preserveAspectRatio="none"><image href={src} width="100%" height="100%" filter={'url(#leaf-alpha-'+id+')'}/></svg>
    </mask>
    <linearGradient id={'leaf-shade-x-'+id}><stop stopColor="rgb(16,30,18)" stopOpacity=".17"/><stop offset=".65" stopColor="rgb(16,30,18)" stopOpacity="0"/></linearGradient>
    <linearGradient id={'leaf-shade-y-'+id} x1="0" y1="1" x2="0" y2="0"><stop stopColor="rgb(14,24,12)" stopOpacity=".2"/><stop offset=".3" stopColor="rgb(14,24,12)" stopOpacity="0"/></linearGradient>
   </defs>
   <g mask={'url(#leaf-mask-'+id+')'}>
    <svg className="foliage-photo" {...geometry(id==='wide')} viewBox={viewBox} preserveAspectRatio="none"><image href={src} width="100%" height="100%"/></svg>
    <rect width="100%" height="100%" fill={'url(#leaf-shade-x-'+id+')'}/><rect width="100%" height="100%" fill={'url(#leaf-shade-y-'+id+')'}/>
   </g>
  </svg>)}
 </div>;
}
