type Article = {supplier_id:string; product_id:number; code:string};
const norm=(v:unknown)=>String(v??'').normalize('NFKC').trim().toLocaleLowerCase('it-IT');
function expiry(value:string){
 const italian=value.trim().match(/^(\d{2})[/.](\d{2})[/.](\d{4})$/);
 const iso=italian?`${italian[3]}-${italian[2]}-${italian[1]}`:value.trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
 const date=new Date(iso+'T00:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:'';
}
/** Exact supplier-scoped codes only: O/0, punctuation and units are never guessed. */
export function matchOcr(result:{text?:string;tables?:Record<string,string>[][]},articles:Article[],supplierId:string){
 const rows=(result.tables||[]).flat();
 return rows.map(row=>{
  const field=(pattern:RegExp)=>Object.entries(row).find(([key])=>pattern.test(norm(key)))?.[1]||'';
  const code=field(/^(codice|cod\.?|articolo|codice articolo|code|item code)$/);
  const matches=articles.filter(a=>a.supplier_id===supplierId&&norm(a.code)===norm(code)&&code!=='');
  const qty=field(/^(quantità|quantita|qta|q\.tà|qty|quantity)$/);
  const lot=field(/^(lotto|lot|batch)$/),expires=field(/^(scadenza|expiry|expires)$/);
  return {id:matches.length===1?matches[0].product_id:0,code,qty:/^[1-9]\d{0,5}$/.test(qty.trim())?qty.trim():'',lot,expires:expiry(expires),source:JSON.stringify(row),uncertain:true};
 });
}
