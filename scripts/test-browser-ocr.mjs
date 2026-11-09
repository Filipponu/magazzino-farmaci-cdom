import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createWorker} from 'tesseract.js';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {scannedFixture} from './scan-fixture.mjs';
import {extractScan} from '../src/lib/pharmacy/scan-extraction.ts';
const pdf=await getDocument({data:new Uint8Array(scannedFixture()),useSystemFonts:true}).promise;
const worker=await createWorker('ita',1,{langPath:'public/ocr/languages',cacheMethod:'none'});
const pages=[];
try{
 for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i);assert.equal((await page.getTextContent()).items.length,0);
  const viewport=page.getViewport({scale:200/72}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  const {data}=await worker.recognize(canvas.toBuffer('image/png'),{}, {text:true,tsv:true});pages.push({text:data.text,tsv:data.tsv});page.cleanup();
 }
 const result=extractScan({pages,text:pages.map(p=>p.text).join('\n')},[{id:1,name:'Garza sintetica'},{id:2,name:'Presidio sintetico'}],[{id:'A',name:'Fornitore Sintetico Alfa'}],[{supplier_id:'A',product_id:1,code:'TEST-010'},{supplier_id:'A',product_id:2,code:'TEST-O10'}]);
 assert.equal(pages.length,2);assert.equal(result.supplierId,'A');assert.equal(result.number,'TEST-2026-001');assert.equal(result.date,'2026-11-07');
 assert.ok(result.lines.some(l=>l.qty==='12'));assert.ok(result.lines.some(l=>l.qty==='3'));assert.ok(result.lines.every(l=>l.uncertain));
 assert.ok(result.lines.filter(l=>l.description.includes('Presidio')).every(l=>l.id!==1),'Un codice O/0 ambiguo non deve assegnare il prodotto in conflitto con la descrizione.');
 console.log('PASS: PDF sintetico scannerizzato, due pagine senza testo, OCR Tesseract reale a 200 DPI, fornitore/DDT/data/quantità e revisione obbligatoria.');
 console.log(JSON.stringify(result.lines));
}finally{await worker.terminate();await pdf.destroy();}
