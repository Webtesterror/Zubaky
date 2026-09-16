export const env=new Proxy({} as {DB:D1Database,BUCKET:R2Bucket},{get:(_target,key)=>((globalThis as unknown as {__localBindings:Record<string,unknown>}).__localBindings)[key as string]});
