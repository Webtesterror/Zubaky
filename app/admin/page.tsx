import {adminStatus} from '@/lib/admin';
import AdminEditor from './editor';
import Setup from './setup';
export const dynamic='force-dynamic';
export default async function Admin(){try{const status=await adminStatus();if(!status.user)return <main className="login"><h1>Správa obsahu</h1><p>Přihlaste se pro úpravu webu Zuby Dásně.</p><a className="primary" href="/signin-with-chatgpt?return_to=/admin" target="_top">Přihlásit se přes ChatGPT</a><p><a href="/">Zpět na web</a></p></main>;if(!status.configured)return <Setup/>;if(!status.allowed)return <main className="login"><h1>Přístup pouze pro správce</h1><p>Tento účet nemá oprávnění upravovat web.</p><a href="/signout-with-chatgpt?return_to=/admin" target="_top">Odhlásit se</a></main>;return <AdminEditor/>}catch{return <main className="login"><h1>Správa je dočasně nedostupná</h1><p>Obsah nelze načíst. Zkuste stránku obnovit později.</p><a href="/">Zpět na web</a></main>}}
