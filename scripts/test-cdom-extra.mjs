// Invoked with the same PostgreSQL test connection; all identities and stock synthetic.
export async function scenarios({db,assert,action,login,admin,operator,outsider,o}){
 await login(admin,'owner@example.test');
 await action({action:'access',id:outsider,enabled:true}).catch(()=>{});
 // Register third synthetic operator and verify independent monthly counts.
 await login(outsider,'third@example.test');
 await action({action:'register',first:'Terzo',last:'Sintetico',profession:'Fisioterapista'});
 await db.exec("update auth.users set encrypted_password='SYNTHETIC-CHANGED' where id='00000000-0000-4000-8000-000000000003'");
 await login(admin,'owner@example.test');await action({action:'access',id:outsider,enabled:true});
 await action({action:'product',name:'Prodotto sintetico limiti',unit:'pezzi',pack:'',category:'Test',brand:'Marchio sintetico'});
 const pid=(await db.query("select id from pharmacy_products where name='Prodotto sintetico limiti'")).rows[0].id;
 await action({action:'stock',id:pid,stock:100,minimum:5,version:0});await action({action:'limit',id:pid,limit:5});
 const request=(n,qty=3)=>({...o,id:'00000000-0000-4000-8000-'+String(400000000000+n),items:[{id:pid,qty}],month:'2099-01'});
 await login(operator,'operator@example.test');await action(request(1));
 assert.equal((await db.query('select approval,month from pharmacy_orders where id=$1',[request(1).id])).rows[0].approval,'approved');
 assert.notEqual((await db.query('select month from pharmacy_orders where id=$1',[request(1).id])).rows[0].month,'2099-01');
 await action(request(2,1));assert.equal((await db.query('select stock from pharmacy_products where id=$1',[pid])).rows[0].stock,97);
 await login(outsider,'third@example.test');await action(request(3));assert.equal((await db.query('select approval from pharmacy_orders where id=$1',[request(3).id])).rows[0].approval,'approved');
 await login(admin,'owner@example.test');await action({action:'reject',id:request(2).id,reason:'Rifiuto sintetico motivato'});
 assert.equal((await db.query('select stock from pharmacy_products where id=$1',[pid])).rows[0].stock,94);
 // Historical month remains, current month's first submission auto-authorizes.
 await db.query("update pharmacy_orders set month='2000-01' where user_id=$1 and id=$2",[operator,request(1).id]);
 await db.query("update pharmacy_orders set month='2000-01' where id=$1",[request(2).id]);
 await login(operator,'operator@example.test');await action(request(4));
 assert.equal((await db.query('select approval from pharmacy_orders where id=$1',[request(4).id])).rows[0].approval,'approved');
 await assert.rejects(()=>action(request(5,-1)),/Quantità/);
 await assert.rejects(()=>action({...request(5),items:[{id:pid,qty:1},{id:pid,qty:1}]}),/ripetuto/);
 await login(admin,'owner@example.test');await action({action:'limit',id:pid,limit:''});
 // Actual PostgreSQL FEFO allocation and exact restoration, expired lots quarantined.
 await db.query("insert into pharmacy_lots(product_id,code,expires,quantity) values($1,'SCADUTO-SINTETICO','2000-01-01',80),($1,'VALIDO-SINTETICO','2099-01-01',6)",[pid]);
 await login(operator,'operator@example.test');await assert.rejects(()=>action(request(6,7)),/stock_unavailable/);
 await action(request(7,2));assert.equal((await db.query("select quantity from pharmacy_lots where code='VALIDO-SINTETICO'")).rows[0].quantity,4);
 await login(admin,'owner@example.test');await action({action:'status',id:request(7).id,status:'Annullato'});
 assert.equal((await db.query("select quantity from pharmacy_lots where code='VALIDO-SINTETICO'")).rows[0].quantity,6);
 await action({action:'stock',id:pid,stock:86,minimum:5,version:(await db.query('select version from pharmacy_products where id=$1',[pid])).rows[0].version});
 await login(operator,'operator@example.test');
 // Concurrent API-like submissions. PGlite queues transactions; a real multi-session
 // race test is deliberately not claimed by this embedded test.
 const batch=await Promise.allSettled(Array.from({length:10},(_,i)=>action(request(100+i,1))));
 assert.equal(batch.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await db.query('select stock from pharmacy_products where id=$1',[pid])).rows[0].stock,85);
 await db.exec('set role authenticated');
 for(const table of ['pharmacy_suppliers','pharmacy_lots','pharmacy_articles','pharmacy_audit','pharmacy_delivery_lots','pharmacy_ocr'])await assert.rejects(()=>db.query('select * from '+table),/permission denied/);
 await assert.rejects(()=>db.query('select pharmacy_action_legacy($1::jsonb)',[JSON.stringify({action:'seed'})]),/permission denied/);
 await assert.rejects(()=>db.query('select pharmacy_order($1)',[request(3).id]),/non accessibile/);
 const data=(await db.query('select pharmacy_data() d')).rows[0].d;
 assert.equal('lots' in data,false);assert.equal('suppliers' in data,false);
 await db.exec('reset role');
 await login(admin,'owner@example.test');await db.exec('set role authenticated');
 assert.ok((await db.query("select * from storage.objects where bucket_id='bolle'")).rows.length>0);
 await db.exec('reset role');await login(operator,'operator@example.test');await db.exec('set role authenticated');
 assert.equal((await db.query("select * from storage.objects where bucket_id='bolle'")).rows.length,0);
 await db.exec('reset role');
 console.log('PASS: primo ordine automatico, seconda richiesta, separazione operatori, storia mensile, FEFO, scaduti, restituzione lotti, richieste accodate e permessi nuove tabelle.');
}
