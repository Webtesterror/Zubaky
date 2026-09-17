'use client';
import type {Content} from '@/lib/content';
import {englishText,translationEntries,translatedContent} from '@/lib/i18n';
import {PreferencesProvider} from '../preferences';
import {Announcement,SectionContent} from '../reception';
export default function Translations({data,change,preview=false}:{data:Content,change:(source:string,value:string)=>void,preview?:boolean}){
 const entries=translationEntries(data),missing=entries.filter(e=>!englishText(data,e.text)).length;
 if(preview){const en=translatedContent(data,'en');return <PreferencesProvider initialLocale="en" initialConsent="rejected"><div lang="en"><Announcement text={en.announcement}/>{[['o-nas','About us'],['nas-tym','Our team'],['prubeh-lecby','Treatment process'],['cenik','Prices'],['kontakt','Contact'],['objednani','Appointments']].map(([id,title])=><section className="admin-card" key={id}><h2>{title}</h2><SectionContent id={id} data={en}/></section>)}</div></PreferencesProvider>}
 return <><h2>Anglické překlady</h2><p>Upravte anglické texty a zveřejněte změny. Jména, fotografie, ceny a kontaktní údaje jsou společné pro oba jazyky. Při změně českého textu doplňte jeho nový překlad; do té doby se zobrazí český originál.</p><p role="status">{missing?`Zbývá přeložit: ${missing}`:'Všechny aktuální texty mají anglický překlad.'}</p>{entries.map(({text,group})=><section className="admin-card" key={text}><h3>{group}</h3><div className="admin-row"><div><strong>Čeština</strong><p className="translation-source" lang="cs">{text}</p></div><label className="field">Angličtina<textarea lang="en" value={englishText(data,text)} rows={text.length>200?7:3} maxLength={20000} onChange={e=>change(text,e.target.value)}/></label></div></section>)}</>;
}
