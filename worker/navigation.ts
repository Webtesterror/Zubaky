export function redirect(url:string):never{throw new Response(null,{status:302,headers:{Location:url}})}
