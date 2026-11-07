export type DeliveryLine={key:string,id:number,qty:string,source:string;lot?:string;expires?:string};
const normalize=(s:string)=>s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]+/g,' ').trim();
export function suggestDelivery(text:string,products:any[]){
 const lines:DeliveryLine[]=[];const used=new Set();
 for(const raw of text.split(/\n/)){const source=raw.trim();if(source.length<8)continue;const normalized=normalize(source);let best:any=null;let bestScore=0;
  for(const p of products){const name=normalize(p.name);const words=name.split(' ').filter((w:string)=>w.length>2&&!['CON','PER','DEL','DAI','UNA','SOLO','DELLE','SU','PRESCRIZIONE','SPECIALISTICA'].includes(w));if(!words.length)continue;const hits=words.filter((w:string)=>normalized.split(' ').includes(w)).length;const score=normalized.includes(name)?1:hits/words.length;if(score>bestScore&&hits>=Math.min(2,words.length)){best=p;bestScore=score;}}
  if(best&&bestScore>=.7&&!used.has(best.id)){used.add(best.id);lines.push({key:String(best.id),id:best.id,qty:'',source});}
 }
 // Quantity is deliberately left blank: pack sizes, codes and prices can look like quantities.
 const number=text.match(/^\s*(?:DDT|BOLLA|DOCUMENTO[ \t]+DI[ \t]+TRASPORTO)(?:[ \t]+(?:N[°.º]?|NUMERO))?[ \t]*[:\-]?[ \t]*([A-Z0-9/.-]*\d[A-Z0-9/.-]*)\b/im)?.[1]||'';
 const d=text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d{2})\b/);const date=d?`${d[3]}-${d[2].padStart(2,'0')}-${d[1].padStart(2,'0')}`:'';
 return {lines,number,date};
}
export async function readDelivery(file:File,onProgress:(s:string)=>void){
 let worker:any;let pdf:any;let text='';
 const ocr=async(image:any)=>{if(!worker){onProgress('Preparazione lettura della scansione…');const {createWorker}=await import('tesseract.js');worker=await createWorker('ita',1,{workerPath:location.origin+'/ocr/worker.min.js',corePath:location.origin+'/ocr/core',langPath:location.origin+'/ocr/languages',workerBlobURL:false,logger:m=>{if(m.status==='recognizing text')onProgress('Lettura della scansione: '+Math.round(m.progress*100)+'%');}});}return (await worker.recognize(image)).data.text;};
 try{
  if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){onProgress('Apertura del PDF…');const lib=await import('pdfjs-dist');lib.GlobalWorkerOptions.workerSrc='/ocr/pdf.worker.min.mjs';pdf=await lib.getDocument({data:await file.arrayBuffer(),useSystemFonts:true}).promise;if(pdf.numPages>20)throw new Error('La lettura automatica supporta fino a 20 pagine. Puoi comunque compilare la bolla manualmente.');
   for(let i=1;i<=pdf.numPages;i++){onProgress(`Lettura pagina ${i} di ${pdf.numPages}…`);const page=await pdf.getPage(i);const content=await page.getTextContent();let pageText='';let prevY:number|undefined;for(const item of content.items as any[]){if(!item.str)continue;const y=Math.round(item.transform[5]);pageText+=(prevY!==undefined&&Math.abs(y-prevY)>3?'\n':' ')+item.str;prevY=y;if(item.hasEOL)pageText+='\n';}
    if(pageText.replace(/\s/g,'').length<30){const base=page.getViewport({scale:1});const scale=Math.min(2,2200/Math.max(base.width,base.height));const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;pageText=await ocr(canvas);canvas.width=0;canvas.height=0;}
    text+=pageText+'\n';page.cleanup();if(text.length>80000)throw new Error('Testo troppo lungo. Dividi il documento in più bolle.');
   }
  }else{onProgress('Lettura della foto…');const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,3000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);text=await ocr(canvas);canvas.width=0;canvas.height=0;}finally{bitmap.close();}}
  if(!text.trim())throw new Error('Testo non rilevato. Prova una foto più nitida o compila i dati manualmente.');return text.slice(0,80000);
 }finally{if(worker)await worker.terminate();if(pdf)await pdf.destroy();}
}

