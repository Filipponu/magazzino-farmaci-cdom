// Offline validation only: no service connections, secrets or secret values in output.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const config=JSON.parse(await fs.readFile(new URL('../config/collaudo.json',import.meta.url),'utf8'));
const vercel=JSON.parse(await fs.readFile(new URL('../vercel.json',import.meta.url),'utf8'));
export function inspect(env){
 const errors=[],optional=[];
 const url=(key)=>{try{const u=new URL(env[key]);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/';}catch{return false;}};
 if(!url('NEXT_PUBLIC_APP_URL'))errors.push('NEXT_PUBLIC_APP_URL: impostare il dominio HTTPS confermato.');
 if(!url('NEXT_PUBLIC_SUPABASE_URL'))errors.push('NEXT_PUBLIC_SUPABASE_URL: manca un URL HTTPS valido.');
 const key=env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
 if(!key||/service_role|sb_secret_/i.test(key))errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: usare solo la chiave pubblica anon/publishable.');
 // Legacy JWT keys carry their role in the payload. Never echo the key.
 if(key.split('.').length===3){try{const claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url'));if(claims.role!=='anon')errors.push('La chiave JWT pubblica deve avere ruolo anon.');}catch{errors.push('Chiave JWT pubblica non valida.');}}
 if(Boolean(env.DOCLING_API_URL)!==Boolean(env.DOCLING_API_TOKEN))errors.push('Docling: configurare entrambi i campi oppure lasciarli entrambi vuoti.');
 else if(env.DOCLING_API_URL){if(!url('DOCLING_API_URL')||(env.DOCLING_API_TOKEN||'').length<32)errors.push('Docling: URL HTTPS e segreto server di almeno 32 caratteri richiesti.');}
 else optional.push('OCR non configurato: usare la verifica manuale delle bolle.');
 return {errors,optional};
}
assert.equal(vercel.git?.deploymentEnabled,false,'I deploy Git devono restare disabilitati.');
assert.equal(config.vercelProjectName,'magazzino-farmaci-cdom-test');
if(process.argv.includes('--self-test')){
 const base={NEXT_PUBLIC_APP_URL:config.requestedAppUrl,NEXT_PUBLIC_SUPABASE_URL:'https://synthetic.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'sb_publishable_SYNTHETIC_NOT_A_CREDENTIAL'};
 assert.equal(inspect({}).errors.length,3);assert.equal(inspect(base).errors.length,0);
 assert.ok(inspect({...base,NEXT_PUBLIC_SUPABASE_ANON_KEY:'sb_secret_SYNTHETIC'}).errors.length);
 assert.ok(inspect({...base,DOCLING_API_URL:'http://synthetic.test'}).errors.length);
 console.log('PASS: configurazione offline, segreti pubblici rifiutati, OCR facoltativo e deploy automatici bloccati.');
}else{
 const result=inspect(process.env);
 for(const message of [...result.errors,...result.optional])console.log(message);
 console.log('Controllo locale: non verifica dominio, credenziali o connessioni esterne.');
 if(result.errors.length)process.exitCode=2;
}
