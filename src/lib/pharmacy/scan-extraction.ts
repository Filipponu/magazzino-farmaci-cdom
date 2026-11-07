export type ScanPage={text:string;tsv:string};
export type ScanResult={text:string;pages:ScanPage[]};
type Word={text:string;x:number;y:number;height:number;confidence:number};
type Product={id:number;name:string};
type Supplier={id:string;name:string};
type Article={supplier_id:string;product_id:number;code:string};
export type ScanLine={key:string;id:number;qty:string;lot?:string;expires?:string;code?:string;description?:string;source:string;uncertain?:boolean};
const norm=(s:string)=>s.normalize('NFKC').trim().toLowerCase();
const label=(s:string)=>norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
export function scanDate(value:string){const v=value.trim(),m=v.match(/^(\d{2})[/.\-](\d{2})[/.\-](\d{4})$/);const iso=m?`${m[3]}-${m[2]}-${m[1]}`:v;if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';const d=new Date(iso+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===iso?iso:'';}
function rows(tsv:string){
 const words:Word[]=tsv.split(/\r?\n/).slice(1).flatMap(row=>{const a=row.split('\t');if(a.length<12||a[0]!=='5'||!a.slice(11).join('\t').trim())return [];return [{text:a.slice(11).join('\t').trim(),x:Number(a[6]),y:Number(a[7]),height:Number(a[9]),confidence:Number(a[10])}];}).filter(w=>Number.isFinite(w.x)&&Number.isFinite(w.y)).sort((a,b)=>a.y-b.y||a.x-b.x);
 const groups:Word[][]=[];
 for(const word of words){const last=groups[groups.length-1];if(last&&Math.abs(word.y-last[0].y)<Math.max(8,Math.min(word.height,last[0].height)*.6))last.push(word);else groups.push([word]);}
 return groups.map(r=>r.sort((a,b)=>a.x-b.x));
}
function column(word:string){const s=label(word);if(['codice','cod','articolo','code'].includes(s))return 'code';if(['descrizione','descr','prodotto','description'].includes(s))return 'description';if(['quantita','qta','qty','quantity'].includes(s))return 'qty';if(['lotto','lot','batch'].includes(s))return 'lot';if(['scadenza','scad','expiry'].includes(s))return 'expires';return '';}
export function extractScan(scan:ScanResult,products:Product[],suppliers:Supplier[],articles:Article[],preferredSupplier=''){
 const warnings:string[]=['Tutte le proposte OCR richiedono controllo sul PDF originale.'];
 const text=scan.text,hay=' '+norm(text).replace(/\s+/g,' ')+' ';
 const candidates=suppliers.filter(s=>s.name.trim().length>=4&&hay.includes(' '+norm(s.name).replace(/\s+/g,' ')+' '));
 const supplierId=preferredSupplier||(candidates.length===1?candidates[0].id:'');
 if(!supplierId)warnings.push('Fornitore assente o ambiguo: selezionarlo manualmente.');
 const lines:ScanLine[]=[];
 for(const page of scan.pages){
  let headers:{key:string;x:number}[]=[];
  for(const row of rows(page.tsv)){
   const h=row.flatMap(w=>{const key=column(w.text);return key?[{key,x:w.x}]:[];});
   if(h.some(c=>c.key==='qty')&&h.some(c=>c.key==='code'||c.key==='description')){headers=h.filter((c,i)=>h.findIndex(o=>o.key===c.key)===i).sort((a,b)=>a.x-b.x);continue;}
   if(!headers.length)continue;
   const fields:Record<string,string>={};
   for(const word of row){const cols=headers.filter(c=>word.x>=c.x-18),c=cols[cols.length-1];if(c)fields[c.key]=((fields[c.key]||'')+' '+word.text).trim();}
   if(!fields.code&&!fields.description)continue;
   if(/^(totale|imponibile|iva|trasporto|firma)\b/i.test(fields.description||fields.code))continue;
   const code=(fields.code||'').trim(),description=fields.description||'';
   const matched=articles.filter(a=>a.supplier_id===supplierId&&norm(a.code)===norm(code)&&code!=='');
   if(fields.qty&&!/^[1-9]\d{0,5}$/.test(fields.qty))warnings.push('Quantità incerta: completarla manualmente.');
   if(fields.expires&&!scanDate(fields.expires))warnings.push('Scadenza non riconosciuta: controllarla sul documento originale.');
   const exactName=products.filter(p=>norm(p.name)===norm(description)&&description!==''&&articles.some(a=>a.supplier_id===supplierId&&a.product_id===p.id));
   const conflict=matched.length===1&&exactName.length===1&&matched[0].product_id!==exactName[0].id;
   if(conflict)warnings.push('Codice e descrizione non concordano: scegliere manualmente il prodotto.');
   const id=conflict||matched.length>1?0:matched.length===1?matched[0].product_id:exactName.length===1?exactName[0].id:0;
   lines.push({key:String(lines.length),id,code,description,qty:/^[1-9]\d{0,5}$/.test(fields.qty||'')?fields.qty:'',lot:fields.lot||'',expires:scanDate(fields.expires||''),source:row.map(w=>w.text).join(' '),uncertain:true});
  }
  if(!headers.length){for(const source of page.text.split(/\r?\n/)){const tokens=source.split(/\s+/).map(norm);const found=articles.filter(a=>a.supplier_id===supplierId&&tokens.includes(norm(a.code)));if(found.length===1)lines.push({key:String(lines.length),id:found[0].product_id,code:found[0].code,description:'',qty:'',source,uncertain:true});}warnings.push('Tabella senza intestazioni leggibili: quantità da completare manualmente.');}
 }
 const number=text.match(/(?:DDT|BOLLA|DOCUMENTO\s+DI\s+TRASPORTO)\s*(?:N[°.º]?|NUMERO)?\s*[:\-]?\s*([A-Z0-9/.-]*\d[A-Z0-9/.-]*)/i)?.[1]||'';
 const dateLine=text.split(/\r?\n/).find(s=>/\bdata\b/i.test(s))||text.split(/\r?\n/).find(s=>/DDT|BOLLA/i.test(s))||'';
 const date=scanDate(dateLine.match(/\b\d{2}[/.\-]\d{2}[/.\-]\d{4}\b/)?.[0]||'');
 if(lines.length>300)warnings.push('Proposte limitate alle prime 300 righe: verificare la completezza della bolla.');
 return {supplierId,supplierCandidates:candidates,number,date,lines:lines.slice(0,300),warnings:[...new Set(warnings)]};
}
