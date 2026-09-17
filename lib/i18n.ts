import english from './english.json';
import type {Content} from './content';
import type {Locale} from './preferences';
export const englishDefault:Record<string,string>=english;
export function englishText(data:Content,text:string){return data.english?.[text]!==undefined?data.english[text].trim():(englishDefault[text]||'');}
export function translatedContent(data:Content,locale:Locale):Content{
 if(locale==='cs')return data;
 const t=(s:string)=>englishText(data,s)||s;
 return {...data,intro:t(data.intro),announcement:t(data.announcement||''),about:data.about.map(t),photos:data.photos.map(p=>({...p,alt:t(p.alt)})),team:data.team.map(p=>({...p,role:t(p.role),description:t(p.description),alt:t(p.alt)})),steps:data.steps.map(s=>({...s,title:t(s.title),text:t(s.text)})),priceNote:t(data.priceNote),categories:data.categories.map(c=>({...c,name:t(c.name),items:c.items.map(p=>({...p,name:t(p.name),note:t(p.note),unit:t(p.unit)}))})),bookingNote:t(data.bookingNote),contact:{...data.contact,hours:data.contact.hours.map(h=>({...h,day:t(h.day),time:t(h.time)}))}};
}
export function translationEntries(data:Content){
 const entries=new Map<string,string>();
 const add=(group:string,text:string)=>{if(text.trim()&&!entries.has(text))entries.set(text,group)};
 add('Mimořádná zpráva',data.announcement||'');
 data.about.forEach(t=>add('O nás',t));data.photos.forEach(p=>add('Popisy fotografií',p.alt));
 data.team.forEach(p=>{add('Náš tým',p.role);add('Náš tým',p.description);add('Popisy fotografií',p.alt)});
 data.steps.forEach(s=>{add('Průběh léčby',s.title);add('Průběh léčby',s.text)});
 add('Ceník',data.priceNote);data.categories.forEach(c=>{add('Ceník',c.name);c.items.forEach(p=>{add('Ceník',p.name);add('Ceník',p.note);add('Ceník',p.unit)})});
 data.contact.hours.forEach(h=>{add('Kontakt',h.day);if(!/^[\d\s:–-]+$/.test(h.time))add('Kontakt',h.time)});
 add('Objednání',data.bookingNote);
 return [...entries].map(([text,group])=>({text,group}));
}
export const ui:Record<string,string>={
 'O nás':'About us','Náš tým':'Our team','Průběh léčby':'Treatment process','Ceník':'Prices','Kontakt':'Contact','Objednání':'Appointments',
 'Mimořádná zpráva':'Important notice','Telefon, e-mail, adresa, sítě':'Phone, email, address & social media','Otevírací doba':'Opening hours',
 'Otevřít mapu a navigaci ↗':'Open map & directions ↗','Mapa — Zuby Dásně, Hradec Králové':'Map — Zuby Dásně, Hradec Králové',
 'Facebook — otevřít v nové záložce':'Facebook — opens in a new tab','Instagram — otevřít v nové záložce':'Instagram — opens in a new tab',
 'Objednací formulář':'Appointment enquiry','Jméno a příjmení':'Full name','E-mail':'Email','Telefon':'Phone','Vaše zpráva':'Your message','Odeslat':'Send',
 'Zadejte telefonní číslo, případně s předvolbou.':'Enter your phone number, including the country code if needed.',
 'Údaje nebyly odeslány ani uloženy. Online objednávání zatím není aktivní.':'Your details have not been sent or saved. Online booking is not yet available.',
 'Ochrana osobních údajů':'Privacy policy (in Czech)','Zuby Dásně — stomatologické centrum':'Zuby Dásně — dental clinic','Hlavní sekce':'Main sections',
 'Správa obsahu':'Content management','Zavřít sekci':'Close section',
 'Nastavení cookies':'Cookie settings','Vaše soukromí':'Your privacy',
 'Používáme volitelné cookies pro zapamatování jazyka a zobrazení Google Map. Volbu souhlasu si uložíme na 6 měsíců. Bez souhlasu funguje web i přepínání jazyků, ale jazyk si nezapamatujeme.':'We use optional cookies to remember your language and display Google Maps. We store your consent choice for 6 months. You can use the site and switch languages without accepting, but we will not remember your language.',
 'Přijmout cookies':'Accept cookies','Odmítnout cookies':'Reject cookies',
 'Mapa se načte až po souhlasu s cookies pro Google Maps. Můžete také otevřít mapu přímo přes odkaz níže.':'The map loads only after you accept cookies for Google Maps. You can also open the map directly using the link below.',
 'Povolit cookies a zobrazit mapu':'Accept cookies and show map',
};
export const translateUI=(locale:Locale,text:string)=>locale==='en'?(ui[text]||text):text;
