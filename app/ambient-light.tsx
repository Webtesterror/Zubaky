'use client';
import {useEffect,useState} from 'react';

export default function AmbientLight({paused}:{paused:boolean}){
 const [hidden,setHidden]=useState(false);
 useEffect(()=>{
  const sync=()=>setHidden(document.hidden);
  sync();
  document.addEventListener('visibilitychange',sync);
  return()=>document.removeEventListener('visibilitychange',sync);
 },[]);
 return <div className="ambient-plane" data-paused={paused||hidden} aria-hidden="true">
  <div className="ambient-wall">
   <div className="ambient-shadow">
    <svg viewBox="0 0 900 300" preserveAspectRatio="none" focusable="false">
     <defs><filter id="leaf-penumbra" x="-15%" y="-25%" width="130%" height="150%"><feGaussianBlur stdDeviation="7"/></filter></defs>
     <g fill="#243526" filter="url(#leaf-penumbra)">
      <path d="M80 15Q180 86 271 251M614 -25Q545 80 500 189M850 29Q786 127 707 204" fill="none" stroke="#243526" strokeWidth="3"/>
      <ellipse cx="120" cy="49" rx="15" ry="40" transform="rotate(-42 120 49)"/>
      <ellipse cx="167" cy="71" rx="14" ry="36" transform="rotate(38 167 71)"/>
      <ellipse cx="169" cy="120" rx="17" ry="41" transform="rotate(-58 169 120)"/>
      <ellipse cx="223" cy="140" rx="14" ry="35" transform="rotate(22 223 140)"/>
      <ellipse cx="225" cy="203" rx="16" ry="37" transform="rotate(-49 225 203)"/>
      <ellipse cx="592" cy="33" rx="17" ry="42" transform="rotate(42 592 33)"/>
      <ellipse cx="550" cy="83" rx="15" ry="36" transform="rotate(-32 550 83)"/>
      <ellipse cx="539" cy="145" rx="14" ry="39" transform="rotate(44 539 145)"/>
      <ellipse cx="819" cy="75" rx="18" ry="44" transform="rotate(48 819 75)"/>
      <ellipse cx="761" cy="127" rx="15" ry="39" transform="rotate(-24 761 127)"/>
      <ellipse cx="734" cy="182" rx="17" ry="35" transform="rotate(52 734 182)"/>
     </g>
    </svg>
   </div>
   <div className="ambient-caustic">
    <svg viewBox="0 0 900 300" preserveAspectRatio="none" focusable="false">
     <defs><filter id="light-penumbra" x="-15%" y="-35%" width="130%" height="170%"><feGaussianBlur stdDeviation="9"/></filter></defs>
     <g fill="none" stroke="#fff9e6" filter="url(#light-penumbra)">
      <path d="M70 224C188 140 229 163 341 116S566 52 730 90" strokeWidth="19"/>
      <path d="M173 275C287 194 424 236 559 166S732 94 850 133" strokeWidth="9"/>
     </g>
    </svg>
   </div>
  </div>
 </div>;
}
