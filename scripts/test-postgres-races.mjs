import pg from 'pg';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function races(url){
 const pool=new pg.Pool({connectionString:url,max:20});
 const admin='00000000-0000-4000-8000-000000000001',user='00000000-0000-4000-8000-000000000002';
 const adminCall=async payload=>{const c=await pool.connect();try{await c.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);return await c.query('select pharmacy_action($1::jsonb)',[JSON.stringify(payload)]);}finally{c.release();}};
 const submit=async(id,product)=>{const c=await pool.connect();try{await c.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[user,JSON.stringify({email:'operator@example.test'})]);await c.query('set role authenticated');return await c.query('select pharmacy_action($1::jsonb)',[JSON.stringify({action:'order',id,month:'2026-11',note:'Test simultaneo sintetico',items:[{id:product,qty:1}]})]);}finally{await c.query('reset role');c.release();}};
 try{
  await pool.query("insert into pharmacy_products(id,name,unit,stock,minimum,configured) values(900001,'RACE SYNTHETIC','pezzi',110,100,1),(900002,'MONTHLY RACE SYNTHETIC','pezzi',1000,0,1)");
  const stockRace=await Promise.allSettled(Array.from({length:20},()=>submit(randomUUID(),900001)));
  assert.equal(stockRace.filter(r=>r.status==='fulfilled').length,10);
  assert.equal((await pool.query('select stock from pharmacy_products where id=900001')).rows[0].stock,100);
  await adminCall({action:'limit',id:900002,limit:10});
  const ids=Array.from({length:20},()=>randomUUID());
  await Promise.all(ids.map(id=>submit(id,900002)));
  const counts=(await pool.query("select approval,count(*)::int n from pharmacy_orders where id=any($1) group by approval",[ids])).rows;
  assert.equal(counts.find(r=>r.approval==='approved').n,1);assert.equal(counts.find(r=>r.approval==='pending').n,19);
  assert.equal((await pool.query('select stock from pharmacy_products where id=900002')).rows[0].stock,999);
  const pending=(await pool.query("select id from pharmacy_orders where id=any($1) and approval='pending'",[ids])).rows;
  await Promise.all(pending.map(r=>adminCall({action:'approve',id:r.id,reason:'Eccezione simultanea sintetica'})));
  assert.equal((await pool.query('select stock from pharmacy_products where id=900002')).rows[0].stock,980);
  await adminCall({action:'limit',id:900002,limit:''});
  const same=randomUUID();await Promise.all(Array.from({length:20},()=>submit(same,900002)));
  assert.equal((await pool.query('select stock from pharmacy_products where id=900002')).rows[0].stock,979);
  console.log('PASS: PostgreSQL multi-sessione, 20 connessioni concorrenti: soglia minima, prima autorizzazione mensile, 19 approvazioni esplicite, duplicato riservato una sola volta.');
 }finally{await pool.end();}
}
