'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {languageUrl,pageTitle,pageDescription,readPreferences,type Consent,type Locale} from '@/lib/preferences';
import {translateUI} from '@/lib/i18n';
const PreferencesContext=createContext({locale:'cs' as Locale,consent:null as Consent,bannerOpen:false,chooseConsent:(_value:Exclude<Consent,null>)=>{},openSettings:()=>{},chooseLanguage:(_locale:Locale)=>{}});
function writeCookie(name:string,value:string,age=15552000){
 try{document.cookie=`${name}=${value}; Path=/; Max-Age=${age}; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`}catch{/* Disabled cookies: keep the current in-memory choice. */}
}
export function PreferencesProvider({initialLocale='cs',initialConsent=null,children}:{initialLocale?:Locale,initialConsent?:Consent,children:ReactNode}){
 const [locale,setLocale]=useState(initialLocale),[consent,setConsent]=useState(initialConsent),[bannerOpen,setBannerOpen]=useState(initialConsent===null);
 function chooseConsent(value:Exclude<Consent,null>){const fromBanner=document.activeElement?.closest('.cookie-banner');setConsent(value);setBannerOpen(false);writeCookie('zuby_consent','v1-'+value);writeCookie('zuby_lang',value==='accepted'?locale:'',value==='accepted'?15552000:0);if(fromBanner)requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.cookie-settings')?.focus({preventScroll:true}));}
 function chooseLanguage(value:Locale){setLocale(value);history.replaceState(history.state,'',languageUrl(value,location.href));if(consent==='accepted')writeCookie('zuby_lang',value);}
 useEffect(()=>{const sync=()=>setLocale(readPreferences(location.href,document.cookie).locale);addEventListener('popstate',sync);return()=>removeEventListener('popstate',sync)},[]);
 return <PreferencesContext.Provider value={{locale,consent,bannerOpen,chooseConsent,openSettings:()=>setBannerOpen(true),chooseLanguage}}>{children}</PreferencesContext.Provider>;
}
export function usePreferences(){const value=useContext(PreferencesContext);return {...value,t:(text:string)=>translateUI(value.locale,text)}}
export function LanguageSwitcher(){const {locale,chooseLanguage}=usePreferences();return <nav className="language-switch" aria-label={locale==='en'?'Language':'Jazyk'}>{(['cs','en'] as const).map(l=><a key={l} href={'?lang='+l} hrefLang={l} lang={l} aria-label={l==='cs'?'Čeština':'English'} aria-current={locale===l?'true':undefined} onClick={e=>{if(e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();chooseLanguage(l)}}>{l==='cs'?'CZ':'EN'}</a>)}</nav>}
export function CookieBanner(){
 const {bannerOpen,chooseConsent,t}=usePreferences();
 const banner=useRef<HTMLElement>(null);
 // Opening settings from the footer moves focus to the newly revealed controls.
 useEffect(()=>{if(bannerOpen&&document.activeElement?.classList.contains('cookie-settings'))banner.current?.querySelector('button')?.focus()},[bannerOpen]);
 if(!bannerOpen)return null;
 return <section ref={banner} className="cookie-banner" aria-label={t('Nastavení cookies')}><div><strong>{t('Vaše soukromí')}</strong><p>{t('Používáme volitelné cookies pro zapamatování jazyka a zobrazení Google Map. Volbu souhlasu si uložíme na 6 měsíců. Bez souhlasu funguje web i přepínání jazyků, ale jazyk si nezapamatujeme.')}</p></div><div className="cookie-actions"><button className="secondary" onClick={()=>chooseConsent('rejected')}>{t('Odmítnout cookies')}</button><button className="secondary" onClick={()=>chooseConsent('accepted')}>{t('Přijmout cookies')}</button></div></section>;
}
export function PageLanguage(){const {locale}=usePreferences();useEffect(()=>{document.documentElement.lang=locale;document.title=pageTitle(locale);document.querySelector('meta[name="description"]')?.setAttribute('content',pageDescription(locale))},[locale]);return null;}
