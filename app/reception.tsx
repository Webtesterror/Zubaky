'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Heart,Users,Route,ReceiptText,MapPin,CalendarDays,ArrowUpRight,Phone,Mail} from 'lucide-react';
import type {Content} from '@/lib/content';
import SectionPanel from './section-panel';
import AmbientLight from './ambient-light';
const sections=[{id:'o-nas',name:'O nás',Icon:Heart},{id:'nas-tym',name:'Náš tým',Icon:Users},{id:'prubeh-lecby',name:'Průběh léčby',Icon:Route},{id:'cenik',name:'Ceník',Icon:ReceiptText},{id:'kontakt',name:'Kontakt',Icon:MapPin},{id:'objednani',name:'Objednání',Icon:CalendarDays}];
export function SectionContent({id,data}:{id:string,data:Content}){
 const [message,setMessage]=useState('');
 if(id==='o-nas')return <><div className="prose about-text">{data.about.map((p,i)=><p key={i}>{p}</p>)}</div><div className="gallery">{data.photos.filter(p=>p.src).map(p=><img key={p.id} src={p.src} alt={p.alt} loading="lazy" decoding="async" style={{objectPosition:`50% ${p.focus}%`}}/>)}</div></>;
 if(id==='nas-tym'){
  const team=data.team.filter(p=>!p.hidden);
  const profiles=(people:Content['team'])=>people.map(p=><article className="person" key={p.id}>{p.src&&<img src={p.src} alt={p.alt} loading="lazy" decoding="async" style={{objectPosition:`50% ${p.focus}%`}}/>}<div className="person-text"><h3>{p.title==='MDDr.'?'MDDr. ':''}{p.name}{p.title&&p.title!=='MDDr.'?', '+p.title:''}</h3><p>{p.role}</p>{p.description&&<p className="bio">{p.description}</p>}</div></article>);
  return <div className="team-layout"><div className="team-grid team-owners">{profiles(team.slice(0,2))}</div>{team.length>2&&<div className="team-grid">{profiles(team.slice(2))}</div>}</div>;
 }
 if(id==='prubeh-lecby')return <ol className="steps">{data.steps.map((s,i)=><li key={s.id}><span className="step-no">{String(i+1).padStart(2,'0')}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></li>)}</ol>;
 if(id==='cenik')return <><p className="notice">{data.priceNote}</p>{data.categories.map(c=><section className="price-group" key={c.id}><h3>{c.name}</h3>{c.items.map(p=><div className="price-row" key={p.id}><div>{p.name}{p.note&&<small>{p.note}</small>}</div><strong>{p.price}{p.unit&&` / ${p.unit}`}</strong></div>)}</section>)}</>;
 if(id==='kontakt')return <><div className="contact-grid"><div><h3>Telefon, e-mail, adresa, sítě</h3><div className="contact-links"><a href={'tel:'+data.contact.phone.replace(/\s/g,'')}><Phone size={20}/>{data.contact.phone}</a><a href={'mailto:'+data.contact.email}><Mail size={20}/>{data.contact.email}</a><a href={data.contact.map} target="_blank" rel="noreferrer"><MapPin size={22}/>{data.contact.address}</a></div><div className="socials"><a href={data.contact.facebook} target="_blank" rel="noreferrer">Facebook</a><a href={data.contact.instagram} target="_blank" rel="noreferrer">Instagram</a></div></div><div><h3>Otevírací doba</h3><table className="hours"><tbody>{data.contact.hours.map(h=><tr key={h.day}><td>{h.day}</td><td>{h.time}</td></tr>)}</tbody></table></div></div><iframe className="contact-map" title="Mapa — Zuby Dásně, Hradec Králové" src={"https://www.google.com/maps?q="+encodeURIComponent(data.contact.address)+"&output=embed"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/><a className="map-external" href={data.contact.map} target="_blank" rel="noreferrer">Otevřít mapu a navigaci ↗</a></>;
 return <div className="booking-layout"><div><h3 style={{fontSize:'2rem',marginBottom:20}}>Objednací formulář</h3>{data.bookingNote && data.bookingNote !== 'Online objednávání zatím není aktivní. Objednejte se prosím telefonicky nebo e-mailem.' && <p className="notice">{data.bookingNote}</p>}<div className="contact-links"><a href={'tel:'+data.contact.phone.replace(/\s/g,'')}><Phone size={20}/>{data.contact.phone}</a><a href={'mailto:'+data.contact.email}><Mail size={20}/>{data.contact.email}</a></div></div><form className="form-grid" onSubmit={e=>{e.preventDefault();setMessage('Údaje nebyly odeslány ani uloženy. Online objednávání zatím není aktivní.');}}><label className="field">Jméno a příjmení *<input name="name" autoComplete="name" required maxLength={150}/></label><label className="field">E-mail *<input type="email" name="email" autoComplete="email" required maxLength={200}/></label><label className="field">Telefon *<input type="tel" name="phone" autoComplete="tel" required pattern="\+?[0-9\s\-]{9,18}" title="Zadejte telefonní číslo, případně s předvolbou."/></label><label className="field">Vaše zpráva<textarea name="message" maxLength={2000}/></label><button className="primary" type="submit">Odeslat</button>{message&&<p className="form-status" role="status">{message}</p>}<a href="/source/Podminky_ochrany_osobnich-udaju-ZUBY_DASNE.pdf" target="_blank" rel="noreferrer">Ochrana osobních údajů</a></form></div>;
}
export default function Reception({data}:{data:Content}){
 const [requested,setRequested]=useState<string|null>(null);
 const [active,setActive]=useState<string|null>(null);
 const [ready,setReady]=useState(false);
 const scene=useRef<HTMLElement>(null);
 const navigating=useRef(false);

 useEffect(()=>{
  setReady(true);
  const sync=()=>{
   const id=location.hash.slice(1);
   navigating.current=false;
   setRequested(sections.some(s=>s.id===id)?id:null);
  };
  sync();
  addEventListener('popstate',sync);
  addEventListener('hashchange',sync);
  return()=>{removeEventListener('popstate',sync);removeEventListener('hashchange',sync)};
 },[]);
 useEffect(()=>{if(!active&&requested)setActive(requested)},[active,requested]);
 useLayoutEffect(()=>{
  if(!active)return;
  const main=scene.current,overflow=document.body.style.overflow;
  main?.setAttribute('inert','');
  document.body.style.overflow='hidden';
  return()=>{
   main?.removeAttribute('inert');
   document.body.style.overflow=overflow;
   document.getElementById('tile-'+active)?.focus({preventScroll:true});
  };
 },[active]);
 const exited=useCallback(()=>setActive(null),[]);
 const close=useCallback(()=>{
  if(navigating.current)return;
  navigating.current=true;
  if(history.state?.section)history.back();
  else{
   history.replaceState(null,'',location.pathname+location.search);
   setRequested(null);
   navigating.current=false;
  }
 },[]);
 function open(id:string){
  if(navigating.current||active)return;
  history.pushState({section:true},'',`#${id}`);
  setRequested(id);
 }
 return <>
  <div className="reception-bg" aria-hidden="true"><AmbientLight paused={!!(requested||active)}/></div>
  <main className="scene" ref={scene}>
   <header className="topline"><a href={'tel:'+data.contact.phone.replace(/\s/g,'')}><Phone size={15}/>{data.contact.phone}</a></header>
   <div className="stage">
    <h1 className="sr-only">Zuby Dásně — stomatologické centrum</h1>
    <nav className="tiles" aria-label="Hlavní sekce">
     {sections.map(({id,name,Icon})=><a key={id} id={'tile-'+id} href={'#'+id} aria-haspopup="dialog" className={'tile '+(id==='objednani'?'booking':'')} onClick={e=>{e.preventDefault();open(id)}}><Icon aria-hidden="true"/><span>{name}</span><ArrowUpRight className="tile-arrow" aria-hidden="true"/></a>)}
    </nav>
   </div>
   <footer className="footline"><a className="admin-link" href="/admin">Správa obsahu</a></footer>
  </main>
  {active&&<SectionPanel key={active} id={active} title={sections.find(s=>s.id===active)!.name}
   exiting={requested!==active} onClose={close} onExited={exited}
   renderContent={()=><SectionContent id={active} data={data}/>}/>}
  {!ready&&<div className="fallback-content">{sections.map(s=><section key={s.id} id={s.id}><h2>{s.name}</h2><SectionContent id={s.id} data={data}/></section>)}</div>}
 </>;
}
