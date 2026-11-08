'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {usePreferences} from './preferences';
const siteKey='6LfSjwwpAAAAAIdTceKuu36A4CgyMDJQRPFSnI1r';
const endpoint='https://us-central1-zubydasne-b19d4.cloudfunctions.net/verify';
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
  api.ready(()=>{api.execute(key,{action:'submit'}).then(resolve,reject).finally(()=>clearTimeout(timer))});
 }));
}
export default function BookingForm(){
 const {t,locale}=usePreferences(),en=locale==='en';
 const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const [phase,setPhase]=useState<'form'|'leaving'|'success'>('form'),[confirmation,setConfirmation]=useState('');
 const sending=useRef(false),transitionTimer=useRef<number|null>(null),confirmationRef=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{if(transitionTimer.current!==null)window.clearTimeout(transitionTimer.current)},[]);
 useEffect(()=>{if(phase==='success')confirmationRef.current?.focus()},[phase]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(sending.current)return;
  sending.current=true;setBusy(true);setStatus('');
  const form=e.currentTarget,fields=new FormData(form);
  try{
   if(fields.get('website'))throw Error(en?'The request could not be verified.':'Požadavek se nepodařilo ověřit.');
   const captcha=await captchaToken(siteKey);
   const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    name:String(fields.get('name')||'').trim(),email:String(fields.get('email')||'').trim(),phone:String(fields.get('phone')||'').trim(),
    text:String(fields.get('message')||'').trim(),'g-recaptcha-response':captcha,
   }),signal:AbortSignal.timeout(30000)});
   const result=await r.json() as {captchaSuccess?:boolean,emailSent?:boolean};
   if(result.emailSent!==true)throw Error(en?'The request was not sent. Please try again or call us.':'Žádost nebyla odeslána. Zkuste to znovu nebo nám zavolejte.');
   setConfirmation(en?'The appointment form has been sent. We will contact you regarding your request. Thank you.':'Objednací formulář byl odeslán. Na jeho základě Vás budeme dále kontaktovat. Děkujeme.');
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
  <label className="field">{t('Vaše zpráva')} *<textarea name="message" required maxLength={2000}/></label>
  <label className="booking-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  <button className="primary" type="submit" disabled={busy}>{busy?(en?'Sending…':'Odesílám…'):t('Odeslat')}</button>
  {status&&<p className="form-status" role="status">{status}</p>}
  <div className="booking-legal">
   <a href="/source/Podminky_ochrany_osobnich-udaju-ZUBY_DASNE.pdf" target="_blank" rel="noreferrer">{t('Ochrana osobních údajů')}</a>
   <small>{en?'Protected by reCAPTCHA. Google’s ':'Chráněno reCAPTCHA. Platí '}<a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">{en?'Privacy Policy':'zásady ochrany soukromí'}</a>{en?' and ':' a '}<a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">{en?'Terms of Service':'podmínky Google'}</a>.</small>
  </div>
 </form>}
 </div>;
}
