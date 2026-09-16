import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database} from './content';
export async function adminStatus(){
 const user=await getChatGPTUser();
 if(!user)return {user:null,allowed:false,configured:false};
 const owner=await database().prepare('SELECT user_id FROM administrator WHERE id = 1').first<{user_id:string}>();
 return {user,allowed:owner?.user_id===user.userId,configured:!!owner};
}
export function checkOrigin(request:Request){
 const origin=request.headers.get('origin');
 if(!origin||origin!==new URL(request.url).origin)throw new Error('Neplatný původ požadavku.');
}
