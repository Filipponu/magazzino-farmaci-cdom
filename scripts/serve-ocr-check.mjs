// Local synthetic browser check only. No Supabase, credentials or stock endpoints.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {scannedFixture} from './scan-fixture.mjs';
const root=process.cwd();
http.createServer(async(req,res)=>{
 try{
  const p=new URL(req.url,'http://localhost').pathname;
  let data,type='text/javascript';
  if(p==='/'){type='text/html';data=`<!doctype html><html lang="it"><meta charset="utf-8"><title>Collaudo OCR locale C-DOM</title><h1>Collaudo OCR nel browser</h1><p>PDF sintetico scannerizzato di due pagine. Nessun collegamento a Supabase.</p><button id="start">Leggi PDF sintetico</button><pre id="result">Pronto</pre><script src="/tesseract.js"></script><script type="module">import {readDelivery,extractScan} from '/reader.js';document.querySelector('#start').onclick=async()=>{const out=document.querySelector('#result');try{const blob=await(await fetch('/fixture.pdf')).blob();const scan=await readDelivery(new File([blob],'synthetic.pdf',{type:'application/pdf'}),s=>out.textContent=s);const result=extractScan(scan,[{id:1,name:'Garza sintetica'},{id:2,name:'Presidio sintetico'}],[{id:'A',name:'Fornitore Sintetico Alfa'}],[{supplier_id:'A',product_id:1,code:'TEST-010'},{supplier_id:'A',product_id:2,code:'TEST-O10'}]);out.textContent=JSON.stringify({pages:scan.pages.length,...result},null,2);}catch(e){out.textContent='ERRORE: '+e.message;}};</script></html>`;}
  else if(p==='/fixture.pdf'){data=scannedFixture();type='application/pdf';}
  else if(p==='/reader.js'||p==='/scan-extraction.js'){
   const src=await fs.readFile(path.join(root,p==='/reader.js'?'src/app/delivery-reading.ts':'src/lib/pharmacy/scan-extraction.ts'),'utf8');
   data=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace("'../lib/pharmacy/scan-extraction'","'/scan-extraction.js'").replace("import('tesseract.js')","import('/tesseract-shim.js')").replace("import('pdfjs-dist')","import('/pdf.mjs')");
  }else if(p==='/tesseract-shim.js')data='export const createWorker=window.Tesseract.createWorker;';
  else if(p==='/tesseract.js')data=await fs.readFile(path.join(root,'node_modules/tesseract.js/dist/tesseract.min.js'));
  else if(p==='/pdf.mjs')data=await fs.readFile(path.join(root,'node_modules/pdfjs-dist/build/pdf.mjs'));
  else if(p.startsWith('/ocr/')){const file=path.resolve(root,'public','.'+p);if(!file.startsWith(path.resolve(root,'public/ocr')+path.sep))throw Error('path');data=await fs.readFile(file);type=p.endsWith('.wasm')?'application/wasm':p.endsWith('.gz')?'application/octet-stream':'text/javascript';}
  else{res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(500);res.end('Local test error');}
}).listen(3102,'127.0.0.1',()=>console.log('Synthetic browser OCR check: http://127.0.0.1:3102'));
