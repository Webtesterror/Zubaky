'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Heart,Users,Route,ReceiptText,MapPin,CalendarDays,ArrowUpRight,Phone,Mail} from 'lucide-react';
import type {Content} from '@/lib/content';
import SectionPanel from './section-panel';
import SectionPhoto from './section-photo';

import TileLabel from './tile-label';
import WallLogo from './wall-logo';
import {useMobileReveal} from './use-mobile-reveal';
import {PreferencesProvider,LanguageSwitcher,CookieBanner,PageLanguage,usePreferences} from './preferences';
import {translatedContent} from '@/lib/i18n';
import type {Locale,Consent} from '@/lib/preferences';
const sections=[{id:'o-nas',name:'O nás',Icon:Heart},{id:'nas-tym',name:'Náš tým',Icon:Users},{id:'prubeh-lecby',name:'Průběh léčby',Icon:Route},{id:'cenik',name:'Ceník',Icon:ReceiptText},{id:'kontakt',name:'Kontakt',Icon:MapPin},{id:'objednani',name:'Objednání',Icon:CalendarDays}];
export function Announcement({text}:{text?:string}){
 const {t}=usePreferences();
 return text?.trim()?<aside className="notice home-announcement" aria-label={t("Mimořádná zpráva")}>{text}</aside>:null;
}
export function SectionContent({id,data}:{id:string,data:Content}){
 const [message,setMessage]=useState('');
 const {t,locale,consent,chooseConsent}=usePreferences();
 const mapLink=(!data.contact.map || data.contact.map==='https://maps.app.goo.gl/8t9ML6sDr61P4HS56')?'https://maps.app.goo.gl/kuauTduyaYLPFiPQ7':data.contact.map;
 if(id==='o-nas')return <><div className="prose about-text">{data.about.map((p,i)=><p key={i}>{p}</p>)}</div><div className="gallery">{data.photos.filter(p=>p.src).map((p,i)=><SectionPhoto key={p.id+p.src} src={p.src} alt={p.alt} focus={p.focus} eager={i<2}/>)}</div></>;
 if(id==='nas-tym'){
  const team=data.team.filter(p=>!p.hidden);
  const profiles=(people:Content['team'])=>people.map(p=><article className="person" key={p.id}>{p.src&&<SectionPhoto key={p.src} src={p.src} alt={p.alt} focus={p.focus} portrait eager={team.indexOf(p)<4}/>}<div className="person-text"><h3>{p.title==='MDDr.'?'MDDr. ':''}{p.name}{p.title&&p.title!=='MDDr.'?', '+p.title:''}</h3><p>{p.role}</p>{p.description&&<p className="bio">{p.description}</p>}</div></article>);
  return <div className="team-layout"><div className="team-grid">{profiles(team)}</div></div>;
 }
 if(id==='prubeh-lecby')return <ol className="steps">{data.steps.map((s,i)=><li key={s.id}><span className="step-no">{String(i+1).padStart(2,'0')}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></li>)}</ol>;
 if(id==='cenik')return <><p className="notice">{data.priceNote}</p>{data.categories.map(c=><section className="price-group" key={c.id}><h3>{c.name}</h3>{c.items.map(p=><div className="price-row" key={p.id}><div>{p.name}{p.note&&<small>{p.note}</small>}</div><strong>{p.price}{p.unit&&` / ${p.unit}`}</strong></div>)}</section>)}</>;
 if(id==='kontakt')return <><div className="contact-grid"><div><h3>{t("Telefon, e-mail, adresa, sítě")}</h3><div className="contact-links"><a href={'tel:'+data.contact.phone.replace(/\s/g,'')}><Phone size={20}/>{data.contact.phone}</a><a href={'mailto:'+data.contact.email}><Mail size={20}/>{data.contact.email}</a><a href={mapLink} target="_blank" rel="noreferrer"><MapPin size={22}/>{data.contact.address}</a></div><div className="socials"><a className="social-glass" href={data.contact.facebook} target="_blank" rel="noreferrer" aria-label={t("Facebook — otevřít v nové záložce")} title="Facebook"><svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5A24 24 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v8z"/></svg></a><a className="social-glass" href={data.contact.instagram} target="_blank" rel="noreferrer" aria-label={t("Instagram — otevřít v nové záložce")} title="Instagram"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a></div></div><div><h3>{t("Otevírací doba")}</h3><table className="hours"><tbody>{data.contact.hours.map(h=><tr key={h.day}><td>{h.day}</td><td>{h.time}</td></tr>)}</tbody></table></div></div>{consent==='accepted'?<iframe className="contact-map" title={t("Mapa — Zuby Dásně, Hradec Králové")} src={"https://www.google.com/maps?cid=8143083937777111888&output=embed&hl="+locale} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>:<div className="map-consent"><MapPin size={32} aria-hidden="true"/><p>{t("Mapa se načte až po souhlasu s cookies pro Google Maps. Můžete také otevřít mapu přímo přes odkaz níže.")}</p><button className="secondary" onClick={()=>chooseConsent('accepted')}>{t("Povolit cookies a zobrazit mapu")}</button></div>}<a className="map-external" href={mapLink} target="_blank" rel="noreferrer">{t("Otevřít mapu a navigaci ↗")}</a></>;
 return <div className="booking-layout"><div><h3 style={{fontSize:'2rem',marginBottom:20}}>{t("Objednací formulář")}</h3>{data.bookingNote && data.bookingNote !== 'Online objednávání zatím není aktivní. Objednejte se prosím telefonicky nebo e-mailem.' && <p className="notice">{data.bookingNote}</p>}<div className="contact-links"><a href={'tel:'+data.contact.phone.replace(/\s/g,'')}><Phone size={20}/>{data.contact.phone}</a><a href={'mailto:'+data.contact.email}><Mail size={20}/>{data.contact.email}</a></div></div><form className="form-grid" onSubmit={e=>{e.preventDefault();setMessage('Údaje nebyly odeslány ani uloženy. Online objednávání zatím není aktivní.');}}><label className="field">{t("Jméno a příjmení")} *<input name="name" autoComplete="name" required maxLength={150}/></label><label className="field">{t("E-mail")} *<input type="email" name="email" autoComplete="email" required maxLength={200}/></label><label className="field">{t("Telefon")} *<input type="tel" name="phone" autoComplete="tel" required pattern="\+?[0-9\s\-]{9,18}" title={t("Zadejte telefonní číslo, případně s předvolbou.")}/></label><label className="field">{t("Vaše zpráva")}<textarea name="message" maxLength={2000}/></label><button className="primary" type="submit">{t("Odeslat")}</button>{message&&<p className="form-status" role="status">{t(message)}</p>}<a href="/source/Podminky_ochrany_osobnich-udaju-ZUBY_DASNE.pdf" target="_blank" rel="noreferrer">{t("Ochrana osobních údajů")}</a></form></div>;
}
export default function Reception({data,initialLocale='cs',initialConsent=null}:{data:Content,initialLocale?:Locale,initialConsent?:Consent}){
 return <PreferencesProvider initialLocale={initialLocale} initialConsent={initialConsent}><PageLanguage/><ReceptionScene original={data}/></PreferencesProvider>;
}
function ReceptionScene({original}:{original:Content}){
 const {revealing,finishReveal}=useMobileReveal();
 const {locale,t,openSettings}=usePreferences();
 const data=translatedContent(original,locale);
 const [requested,setRequested]=useState<string|null>(null);
 const [active,setActive]=useState<string|null>(null);
 const [ready,setReady]=useState(false);
 const [returning,setReturning]=useState(false);
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
 useLayoutEffect(()=>{
  // Scope the viewport lock to the hydrated homepage, never the CMS or no-JS content.
  document.documentElement.classList.add('reception-page');
  return()=>document.documentElement.classList.remove('reception-page');
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
  useEffect(()=>{
  if(!returning)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const finish=()=>setReturning(false);
  const changed=()=>{if(motion.matches)finish()};
  const timer=setTimeout(finish,1600);
  motion.addEventListener('change',changed);
  changed();
  return()=>{clearTimeout(timer);motion.removeEventListener('change',changed)};
 },[returning]);
 const exited=useCallback(()=>{
  finishReveal();
  setReturning(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  setActive(null);
 },[finishReveal]);
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
  setReturning(false);
  history.pushState({section:true},'',`#${id}`);
  setRequested(id);
 }
 return <>
  <div className="reception-bg" aria-hidden="true"/>
  <main className="scene" ref={scene} data-intro={revealing?'reveal':undefined} data-return={returning?'reveal':undefined} onPointerDownCapture={()=>{finishReveal();setReturning(false)}} onKeyDownCapture={()=>setReturning(false)} onFocusCapture={finishReveal}>
   <header className="topline"><div className="language-and-logo"><LanguageSwitcher/><WallLogo paused={!!(active||requested)}/></div><a href={'tel:'+data.contact.phone.replace(/\s/g,'')}><Phone size={15}/>{data.contact.phone}</a></header>
   <div className="stage">
    <h1 className="sr-only">{t("Zuby Dásně — stomatologické centrum")}</h1>
    <div className="home-navigation">
    <Announcement text={data.announcement}/>
    <nav className="tiles" aria-label={t("Hlavní sekce")}>
     {sections.map(({id,name,Icon})=><a key={id} id={'tile-'+id} href={'#'+id} aria-label={t(name)} aria-haspopup="dialog" className={'tile '+(id==='objednani'?'booking':'')} onClick={e=>{e.preventDefault();open(id)}}><Icon aria-hidden="true"/><TileLabel text={t(name)} locale={locale}/><ArrowUpRight className="tile-arrow" aria-hidden="true"/></a>)}
    </nav>
    </div>
   </div>
   <footer className="footline"><button className="cookie-settings" onClick={openSettings}>{t("Nastavení cookies")}</button><a className="admin-link" href="/admin">{t("Správa obsahu")}</a></footer>
   <CookieBanner/>
  </main>
  {active&&<SectionPanel key={active} id={active} title={t(sections.find(s=>s.id===active)!.name)}
   exiting={requested!==active} onClose={close} onExited={exited}
   renderContent={()=><SectionContent id={active} data={data}/>}/>}
  {!ready&&<div className="fallback-content">{sections.map(s=><section key={s.id} id={s.id}><h2>{t(s.name)}</h2><SectionContent id={s.id} data={data}/></section>)}</div>}
 </>;
}
