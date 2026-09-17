export type Locale='cs'|'en';
export type Consent='accepted'|'rejected'|null;
export function readPreferences(url:string,cookies=''):{locale:Locale,consent:Consent}{
 const values=Object.fromEntries(cookies.split(';').map(p=>{const i=p.indexOf('=');return [p.slice(0,i).trim(),p.slice(i+1).trim()]}));
 const consent:Consent=values.zuby_consent==='v1-accepted'?'accepted':values.zuby_consent==='v1-rejected'?'rejected':null;
 const query=new URL(url).searchParams.get('lang');
 const locale:Locale=query==='en'||query==='cs'?query:consent==='accepted'&&values.zuby_lang==='en'?'en':'cs';
 return {locale,consent};
}
export function languageUrl(locale:Locale,url:string){const u=new URL(url);u.searchParams.set('lang',locale);return u.pathname+u.search+u.hash;}
export const pageTitle=(locale:Locale)=>locale==='en'?'ZUBY | DÁSNĚ — Dental clinic in Hradec Králové':'ZUBY | DÁSNĚ — stomatologické centrum v Hradci Králové';
export const pageDescription=(locale:Locale)=>locale==='en'?'Meet our dental team in Hradec Králové. Explore our clinic, treatment process, prices and contact details.':'ZUBY | DÁSNĚ — informace o ordinaci, náš tým, průběh léčby, ceník a kontakt.';
