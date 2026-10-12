'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {usePreferences} from './preferences';
import {backendConfig} from '@/lib/backend';

type Settings={csrf:string,enabled:boolean,siteKey:string,localTest:boolean};
type Captcha={ready:(f:()=>void)=>void,execute:(key:string,options:{action:string})=>Promise<string>};
let captchaLoad:Promise<Captcha>|undefined;
function captchaToken(key:string):Promise<string>{
 const w=window as Window&{grecaptcha?:Captcha};
 captchaLoad??=new Promise<Captcha>((resolve,reject)=>{
  if(w.grecaptcha){resolve(w.grecaptcha);return}
  const script=document.createElement('script');
  const timer=setTimeout(()=>{script.remove();captchaLoad=undefined;reject(Error('captcha'))},12000);
  script.src='https://www.google.com/recaptcha/api.js?render='+encodeURIComponent(key);script.async=true;
  script.onload=()=>{clearTimeout(timer);if(w.grecaptcha)resolve(w.grecaptcha);else{captchaLoad=undefined;reject(Error('captcha'))}};
  script.onerror=()=>{clearTimeout(timer);script.remove();captchaLoad=undefined;reject(Error('captcha'))};
  document.head.appendChild(script);
 });
 return captchaLoad.then(api=>new Promise<string>((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('captcha')),12000);
  api.ready(()=>{api.execute(key,{action:'booking'}).then(resolve,reject).finally(()=>clearTimeout(timer))});
 }));
}
export default function BookingForm(){
 const {t,locale}=usePreferences(),en=locale==='en';
 const [settings,setSettings]=useState<Settings|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const [phase,setPhase]=useState<'form'|'leaving'|'success'>('form'),[confirmation,setConfirmation]=useState('');
 const sending=useRef(false),attempt=useRef({payload:'',id:''}),transitionTimer=useRef<number|null>(null),confirmationRef=useRef<HTMLDivElement>(null);
 const supported=backendConfig().backend==='forpsi';
 useEffect(()=>{
  if(!supported){setReady(true);return}
  const controller=new AbortController();
  fetch('/api/booking-config',{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();setSettings(await r.json());setReady(true)}).catch(()=>{if(!controller.signal.aborted)setReady(true)});
  return()=>controller.abort();
 },[supported]);
 useEffect(()=>()=>{if(transitionTimer.current!==null)window.clearTimeout(transitionTimer.current)},[]);
 useEffect(()=>{if(phase==='success')confirmationRef.current?.focus()},[phase]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(sending.current)return;
  if(!settings?.enabled){setStatus(en?'The form is not connected yet. Please contact us by phone.':'Formulář ještě není připojený. Objednejte se prosím telefonicky.');return}
  sending.current=true;setBusy(true);setStatus('');
  const form=e.currentTarget,fields=Object.fromEntries(new FormData(form)),payload=JSON.stringify(fields);
  if(attempt.current.payload!==payload)attempt.current={payload,id:crypto.randomUUID()};
  try{
   const captcha=settings.siteKey?await captchaToken(settings.siteKey):'';
   const r=await fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':settings.csrf},body:JSON.stringify({...fields,captcha,requestId:attempt.current.id}),signal:AbortSignal.timeout(30000)});
   const j=await r.json() as {error?:string,localTest?:boolean};
   if(!r.ok){
    const error=en?(r.status===429?'Too many attempts. Please try again later.':r.status===403?'Your session expired. Reload the page and try again.':'Delivery could not be confirmed. Please contact us by phone.'):(j.error||'Odeslání se nepodařilo. Zkuste to později.');
    throw Error(error);
   }
   attempt.current={payload:'',id:''};
   setConfirmation(j.localTest
    ?(en?'Local test: the message was saved in the private test mailbox. No email was sent.':'Místní test: zpráva byla uložena do soukromé testovací schránky. E-mail nebyl odeslán.')
    :(en?'The appointment form has been sent. We will contact you regarding your request. Thank you.':'Objednací formulář byl odeslán. Na jeho základě Vás budeme dále kontaktovat. Děkujeme.'));
   setPhase('leaving');
   transitionTimer.current=window.setTimeout(()=>{form.reset();setPhase('success')},320);
  }catch(error){
   setStatus(error instanceof Error&&error.name==='Error'&&error.message!=='captcha'?error.message:(en?'Delivery could not be confirmed. Your entries remain in the form; please contact us by phone.':'Odeslání se nepodařilo potvrdit. Údaje zůstaly ve formuláři; kontaktujte nás prosím telefonicky.'));
  }finally{sending.current=false;setBusy(false)}
 }
 return <div className="booking-form-shell">
 {phase==='success'?<div className="booking-confirmation" role="status" tabIndex={-1} ref={confirmationRef}><p>{confirmation}</p></div>:<form className={'form-grid booking-form '+(phase==='leaving'?'is-leaving':'')} onSubmit={e=>void submit(e)} aria-busy={busy}>
  <label className="field">{t('Jméno a příjmení')} *<input name="name" autoComplete="name" required maxLength={150}/></label>
  <label className="field">{t('E-mail')} *<input type="email" name="email" autoComplete="email" required maxLength={200}/></label>
  <label className="field">{t('Telefon')} *<input type="tel" name="phone" autoComplete="tel" required pattern="\+?[0-9\s\-]{9,18}" title={t('Zadejte telefonní číslo, případně s předvolbou.')}/></label>
  <label className="field">{t('Vaše zpráva')}<textarea name="message" maxLength={2000}/></label>
  <label className="booking-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  {ready&&!settings?.enabled&&<p role="status">{en?'The online form is not connected yet. Please use the phone or email above.':'Online formulář ještě není připojený. Použijte prosím telefon nebo e-mail uvedený výše.'}</p>}
  {settings?.localTest&&<p className="notice">{en?'Local test — no emails are sent.':'Místní test — e-maily se neodesílají.'}</p>}
  <button className="primary" type="submit" disabled={busy||!ready||!settings?.enabled}>{busy?(en?'Sending…':'Odesílám…'):t('Odeslat')}</button>
  {status&&<p className="form-status" role="status">{status}</p>}
  <a href="/source/Podminky_ochrany_osobnich-udaju-ZUBY_DASNE.pdf" target="_blank" rel="noreferrer">{t('Ochrana osobních údajů')}</a>
  <small>{en?'Protected by reCAPTCHA. Google’s ':'Chráněno reCAPTCHA. Platí '}<a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">{en?'Privacy Policy':'zásady ochrany soukromí'}</a>{en?' and ':' a '}<a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">{en?'Terms of Service':'podmínky Google'}</a>.</small>
 </form>}
 </div>;
}
