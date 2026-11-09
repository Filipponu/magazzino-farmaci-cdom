import assert from 'node:assert/strict';
import {extractScan,scanDate} from '../src/lib/pharmacy/scan-extraction.ts';
const products=[{id:1,name:'Garza'},{id:2,name:'Presidio'}],suppliers=[{id:'A',name:'Fornitore Alfa'},{id:'B',name:'Fornitore Beta'}],articles=[{supplier_id:'A',product_id:1,code:'A-010'},{supplier_id:'A',product_id:2,code:'A-O10'},{supplier_id:'B',product_id:2,code:'A-010'}];
function tsv(qty='12',code='A-010'){const words=[['Codice',10,10],['Descrizione',200,10],['Quantita',500,10],['Lotto',650,10],['Scadenza',800,10],[code,10,50],[code==='A-O10'?'Presidio':'Garza',200,50],[qty,500,50],['LOT-A',650,50],['31/12/2099',800,50]];return 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n'+words.map(([v,x,y])=>[5,1,1,1,1,1,x,y,80,20,90,v].join('\t')).join('\n');}
const run=(qty,code,supplier='A')=>extractScan({text:'Fornitore Alfa\nDDT N. 123 Data 07/11/2026',pages:[{text:'',tsv:tsv(qty,code)}]},products,suppliers,articles,supplier);
assert.equal(run('12','A-010').lines[0].id,1);assert.equal(run('12','A-O10').lines[0].id,2);assert.equal(run('12','A-010','B').lines[0].id,2);
assert.equal(run('1,000','A-010').lines[0].qty,'');assert.equal(run('-2','A-010').lines[0].qty,'');assert.equal(run('12','A-010').lines[0].expires,'2099-12-31');
assert.equal(scanDate('31/02/2026'),'');assert.equal(extractScan({text:'Marchio Alfa',pages:[]},products,suppliers,articles).supplierId,'');
assert.equal(extractScan({text:'Fornitore Alfa Fornitore Beta',pages:[]},products,suppliers,articles).supplierId,'');
console.log('PASS: codici simili e fornitori separati, quantità ambigue, date impossibili e marchi non trasformati in fornitori.');

const conflict=tsv('12','A-010').replace('Garza','Presidio');assert.equal(extractScan({text:'Fornitore Alfa',pages:[{text:'',tsv:conflict}]},products,suppliers,articles).lines[0].id,0);
