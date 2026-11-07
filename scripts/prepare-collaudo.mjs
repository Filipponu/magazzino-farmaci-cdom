// Creates local files only. Does not execute SQL, deploy, provision or connect services.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(process.argv[2]||path.join(root,'work','collaudo-manuale'));
await fs.mkdir(out,{recursive:true});
const names=(await fs.readdir(path.join(root,'supabase/migrations'))).filter(n=>n.endsWith('.sql')).sort();
const sources=await Promise.all(names.map(n=>fs.readFile(path.join(root,'supabase/migrations',n),'utf8')));
await fs.writeFile(path.join(out,'01-schema-supabase-test.sql'),'-- SOLO NUOVO PROGETTO DI COLLAUDO VUOTO. ESEGUIRE UNA SOLA VOLTA.\nBEGIN;\n'+sources.map((s,i)=>'\n-- '+names[i]+'\n'+s).join('\n')+'\nCOMMIT;\n');
await fs.copyFile(path.join(root,'supabase/tests/collaudo-fixtures.sql'),path.join(out,'02-fixture-sintetiche.sql'));
await fs.copyFile(path.join(root,'config/collaudo.env.example'),path.join(out,'variabili-vercel.env.example'));
await fs.copyFile(path.join(root,'COLLEGAMENTO_MANUALE.md'),path.join(out,'LEGGIMI.md'));
await fs.writeFile(path.join(out,'migrazioni-sha256.json'),JSON.stringify(names.map((name,i)=>({name,sha256:createHash('sha256').update(sources[i]).digest('hex')})),null,2)+'\n');
console.log('Preparati '+names.length+' file di migrazione in uno script atomico. Nessuna connessione esterna eseguita.');
