export function registerEditorTools(){
 const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
 if(!context?.registerTool)return;
 const life=new AbortController();
 try{void Promise.resolve(context.registerTool({name:'read_saved_website_draft',title:'Přečíst uložený koncept webu',description:'Přečte poslední uložený koncept ceníku, týmu a textů. Neobsahuje neuložené změny formuláře a nic nemění.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},async execute(input:unknown){if(!input||typeof input!=='object'||Object.keys(input).length)throw Error('Očekáván prázdný objekt.');const r=await fetch('/api/content');if(!r.ok)throw Error('Koncept není dostupný. Přihlaste se jako správce.');return r.json()}},{signal:life.signal})).catch(()=>{})}catch{}
 return()=>life.abort();
}
