'use client';
import {useEffect,useRef,useState} from 'react';
import {usePreferences} from './preferences';

type OrientationAPI=typeof DeviceOrientationEvent & {requestPermission?:()=>Promise<string>};
export default function WallLogo({paused}:{paused:boolean}){
 const {locale}=usePreferences(),en=locale==='en';
 const sign=useRef<HTMLButtonElement>(null);
 const [available,setAvailable]=useState(false),[enabled,setEnabled]=useState(false),[status,setStatus]=useState('');
 const alive=useRef(true);
 useEffect(()=>{
  alive.current=true;
  const mobile=matchMedia('(max-width: 1000px) and (pointer: coarse)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>{const ok=mobile.matches&&!reduced.matches&&window.isSecureContext&&'DeviceOrientationEvent' in window;setAvailable(ok);if(!ok)setEnabled(false)};
  sync();mobile.addEventListener('change',sync);reduced.addEventListener('change',sync);
  return()=>{alive.current=false;mobile.removeEventListener('change',sync);reduced.removeEventListener('change',sync)};
 },[]);
 useEffect(()=>{
  const node=sign.current!;
  if(!enabled||paused){node.style.transform='';return}
  let frame=0,last=0,angle=0,velocity=0,target=0,baseline:number|null=null;
  const reset=()=>{cancelAnimationFrame(frame);frame=0;last=0;angle=velocity=target=0;baseline=null;node.style.transform='';node.style.willChange='auto'};
  const tick=(now:number)=>{
   const dt=Math.min((now-last)/1000||1/60,1/30);last=now;
   velocity+=(36*(target-angle)-8*velocity)*dt;angle+=velocity*dt;
   angle=Math.max(-6,Math.min(6,angle));
   node.style.transform=`rotate(${angle.toFixed(3)}deg)`;
   if(Math.abs(target-angle)>.015||Math.abs(velocity)>.015){frame=requestAnimationFrame(tick)}
   else{frame=0;last=0;node.style.willChange='auto'}
  };
  const tilt=(event:DeviceOrientationEvent)=>{
   if(document.hidden||event.gamma===null||event.beta===null)return;
   const screenAngle=(screen.orientation?.angle??0)*Math.PI/180;
   const value=event.gamma*Math.cos(screenAngle)+event.beta*Math.sin(screenAngle);
   if(!Number.isFinite(value))return;
   if(baseline===null)baseline=value;
   target=Math.max(-5,Math.min(5,(value-baseline)*.16));
   if(!frame){last=0;node.style.willChange='transform';frame=requestAnimationFrame(tick)}
  };
  window.addEventListener('deviceorientation',tilt,{passive:true});
  document.addEventListener('visibilitychange',reset);screen.orientation?.addEventListener('change',reset);
  return()=>{reset();window.removeEventListener('deviceorientation',tilt);document.removeEventListener('visibilitychange',reset);screen.orientation?.removeEventListener('change',reset)};
 },[enabled,paused]);
 async function toggle(){
  if(!available)return;
  if(enabled){setEnabled(false);setStatus('');return}
  try{
   const api=window.DeviceOrientationEvent as OrientationAPI;
   const result=api.requestPermission?await api.requestPermission():'granted';
   if(!alive.current)return;
   if(result==='granted'){setEnabled(true);setStatus('')}
   else setStatus(en?'Motion was not allowed. The sign stays still.':'Pohyb nebyl povolen. Cedulka zůstane nehybná.');
  }catch{if(alive.current)setStatus(en?'Motion is unavailable. The sign stays still.':'Pohyb není dostupný. Cedulka zůstane nehybná.')}
 }
 const label=!available?'Zuby Dásně':enabled?(en?'Turn off sign motion':'Vypnout houpání cedulky'):(en?'Enable sign motion with phone tilt':'Zapnout houpání cedulky podle náklonu telefonu');
 return <div className="wall-logo">
  <button className="wall-sign" ref={sign} type="button" disabled={!available} onClick={toggle} aria-label={label} title={label} aria-pressed={available?enabled:undefined}>
   <img src="/logo-wall.svg" width="94" height="51" alt="" draggable={false}/>
  </button>
  {status&&<span className="wall-logo-status" role="status">{status}</span>}
 </div>;
}
