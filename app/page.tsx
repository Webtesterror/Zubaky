import Reception from './reception';
import { readContent } from '@/lib/content';
export const dynamic = 'force-dynamic';
export default async function Home(){return <Reception data={await readContent('published')}/>;}
