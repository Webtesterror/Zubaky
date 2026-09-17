import {z} from 'zod';
const text=z.string().max(20000),short=z.string().max(500),id=z.string().min(1).max(100);
const source=z.string().max(500).refine(s=>s===''||(/^\/(source|api\/media)\/[a-zA-Z0-9_ %().-]+$/.test(s)&&!s.includes('..')),'Neplatná fotografie');
const photo=z.object({id,src:source,alt:short,focus:z.number().min(0).max(100)});
const url=z.string().url().max(1000).refine(s=>s.startsWith('https://'));
export const contentSchema=z.object({announcement:z.string().trim().max(3000).default(''),intro:short,about:z.array(text).max(30),photos:z.array(photo).max(100),team:z.array(photo.extend({name:short.min(1),title:short,role:short,description:text,hidden:z.boolean()})).max(100),steps:z.array(z.object({id,title:short,text})).max(30),priceNote:text,categories:z.array(z.object({id,name:short.min(1),items:z.array(z.object({id,name:short.min(1),price:short.min(1),unit:short,note:text})).max(300)})).max(50),contact:z.object({phone:z.string().regex(/^\+?[\d \-]{9,20}$/),email:z.string().email(),address:short,map:url,facebook:url,instagram:url,hours:z.array(z.object({day:short,time:short})).max(14)}),bookingNote:text});
