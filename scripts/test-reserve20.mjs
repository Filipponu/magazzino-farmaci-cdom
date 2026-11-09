export async function reserve20({db,assert,action,login,admin,operator,o}){
 const pid=980020;
 await db.query("insert into pharmacy_products(id,name,unit,stock,minimum,configured) values($1,'Riserva sintetica','pezzi',100,0,1)",[pid]);
 const product=async()=>(await db.query('select * from pharmacy_products where id=$1',[pid])).rows[0];
 const request=(n,qty)=>({...o,id:'00000000-0000-4000-8000-'+String(880000000000+n),items:[{id:pid,qty}]});
 assert.equal((await product()).minimum,20);
 await login(operator,'operator@example.test');
 let data=(await db.query('select pharmacy_data() d')).rows[0].d.products.find(p=>p.id===pid);
 assert.equal(data.orderLimit,80);assert.equal(data.requestLimit,100);assert.equal('minimum'in data,false);
 await action(request(1,85));
 let order=(await db.query('select * from pharmacy_orders where id=$1',[request(1).id])).rows[0];
 assert.equal(order.approval,'pending');assert.equal(order.reserved,false);assert.match(order.approval_reason,/20%/);assert.equal((await product()).stock,100);
 await assert.rejects(()=>action({action:'approve',id:order.id,reason:'Tentativo operatore'}),/riservato/);
 await login(admin,'owner@example.test');await action({action:'approve',id:order.id,reason:'Riserva autorizzata dal coordinatore'});
 assert.equal((await product()).stock,15);assert.equal((await product()).minimum,3);
 order=(await db.query('select * from pharmacy_orders where id=$1',[order.id])).rows[0];assert.equal(order.decided_by,admin);assert.equal(order.reserved,true);
 await action({action:'status',id:order.id,status:'Annullato'});assert.equal((await product()).stock,100);assert.equal((await product()).minimum,20);
 await login(operator,'operator@example.test');await assert.rejects(()=>action(request(2,101)),/stock_unavailable/);
 await action(request(3,85));
 await login(admin,'owner@example.test');await action({action:'reject',id:request(3).id,reason:'Riserva non autorizzata'});assert.equal((await product()).stock,100);
 await login(operator,'operator@example.test');await action(request(4,80));assert.equal((await product()).stock,20);assert.equal((await product()).minimum,4);
 await action(request(5,19));await login(admin,'owner@example.test');
 await action({action:'stock',id:pid,stock:10,minimum:999,version:(await product()).version});assert.equal((await product()).minimum,2);
 await assert.rejects(()=>action({action:'approve',id:request(5).id,reason:'Disponibilità nel frattempo ridotta'}),/stock_unavailable/);
 assert.equal((await product()).stock,10);assert.equal((await db.query('select approval from pharmacy_orders where id=$1',[request(5).id])).rows[0].approval,'pending');
 for(const [stock,minimum] of [[0,0],[1,1],[6,2],[99,20],[101,21]]){
  await action({action:'stock',id:pid,stock,minimum:0,version:(await product()).version});assert.equal((await product()).minimum,minimum);
 }
 console.log('PASS: riserva 20%, arrotondamento, soglia non modificabile, eccezione sospesa, decisione solo coordinatore, rifiuto, annullamento e disponibilità ricontrollata.');
}
