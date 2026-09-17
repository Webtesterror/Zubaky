import seed from './seed.json';
import { env } from 'cloudflare:workers';
export type Content=typeof seed;
export const initialContent:Content=seed;
export function database(){if(!env.DB)throw new Error('Databáze není dostupná.');return env.DB;}
export async function readContent(kind:'draft'|'published'):Promise<Content>{
 const row=await database().prepare('SELECT body FROM content WHERE id = ?').bind(kind).first<{body:string}>();
 return row?{announcement:'',...JSON.parse(row.body)}:structuredClone(seed);
}
