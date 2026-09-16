import {AsyncLocalStorage} from 'node:async_hooks';
export const requestContext=new AsyncLocalStorage<Request>();
export async function headers(){const req=requestContext.getStore();if(!req)throw Error('Missing request');return req.headers;}
