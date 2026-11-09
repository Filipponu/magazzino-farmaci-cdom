import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cdom-manual-package-'));
const run=spawnSync(process.execPath,['scripts/prepare-collaudo.mjs',dir],{encoding:'utf8'});
assert.equal(run.status,0,run.stderr);
const source=await fs.readFile('scripts/test-database.mjs','utf8');
// Reuse the synthetic Auth/Storage bootstrap of the main database test.
const setup=source.match(/await db\.exec\(`([\s\S]*?)`\);/)?.[1];assert.ok(setup);
const db=new PGlite();
try{
 await db.exec(setup);
 await db.exec(await fs.readFile(path.join(dir,'01-schema-supabase-test.sql'),'utf8'));
 assert.equal(Number((await db.query('select count(*) n from pharmacy_products')).rows[0].n),135);
 assert.equal((await db.query('select owner_email from pharmacy_settings')).rows[0].owner_email,'monica.silini@finisterre.medicair.it');
 assert.equal((await db.query("select public from storage.buckets where id='bolle'")).rows[0].public,false);
 const hashes=JSON.parse(await fs.readFile(path.join(dir,'migrazioni-sha256.json'),'utf8'));assert.equal(hashes.length,9);
 console.log('PASS: pacchetto SQL manuale completo eseguito atomicamente su database vuoto; catalogo, coordinatore e Storage privato verificati.');
}finally{await db.close();}
