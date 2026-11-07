import {extractScan,type ScanResult,type ScanLine} from '../lib/pharmacy/scan-extraction';
export type DeliveryLine=ScanLine;
export {extractScan};
export function suggestDelivery(text:string,products:{id:number;name:string}[],suppliers:{id:string;name:string}[]=[],articles:{supplier_id:string;product_id:number;code:string}[]=[],supplierId=''){
 return extractScan({text,pages:[{text,tsv:''}]},products,suppliers,articles,supplierId);
}
export async function readDelivery(file:File,onProgress:(s:string)=>void):Promise<ScanResult>{
 let worker:Awaited<ReturnType<typeof import('tesseract.js').createWorker>>|undefined;
 let pdf:import('pdfjs-dist').PDFDocumentProxy|undefined;
 const pages:ScanResult['pages']=[];
 const ocr=async(canvas:HTMLCanvasElement)=>{
  if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker('ita',1,{workerPath:location.origin+'/ocr/worker.min.js',corePath:location.origin+'/ocr/core',langPath:location.origin+'/ocr/languages',workerBlobURL:false,logger:m=>{if(m.status==='recognizing text')onProgress('Riconoscimento locale: '+Math.round(m.progress*100)+'%');}});}
  const {data}=await worker.recognize(canvas,{}, {text:true,tsv:true});
  pages.push({text:data.text,tsv:data.tsv||''});
  if(pages.reduce((n,p)=>n+p.text.length,0)>80000)throw new Error('Testo oltre 80.000 caratteri: dividere il PDF o compilare manualmente.');
 };
 try{
  if(file.size>12*1024*1024)throw new Error('Il file supera 12 MB.');
  if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
   const lib=await import('pdfjs-dist');lib.GlobalWorkerOptions.workerSrc='/ocr/pdf.worker.min.mjs';
   pdf=await lib.getDocument({data:await file.arrayBuffer(),useSystemFonts:true}).promise;
   if(pdf.numPages>20)throw new Error('Massimo 20 pagine per lettura automatica. Suddividi la scansione o usa la compilazione manuale.');
   for(let i=1;i<=pdf.numPages;i++){
    onProgress(`Pagina ${i}/${pdf.numPages}: lettura della scansione nel browser…`);
    const page=await pdf.getPage(i),base=page.getViewport({scale:1});
    const scale=Math.min(200/72,Math.sqrt(12_000_000/(base.width*base.height)));
    const viewport=page.getViewport({scale}),canvas=document.createElement('canvas');
    try{canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;await ocr(canvas);}finally{canvas.width=0;canvas.height=0;page.cleanup();}
   }
  }else{
   const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');
   try{const scale=Math.min(1,3000/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);await ocr(canvas);}finally{bitmap.close();canvas.width=0;canvas.height=0;}
  }
  const text=pages.map(p=>p.text).join('\n\n');if(!text.trim())throw new Error('Testo non rilevato. Il documento resta disponibile per la verifica manuale.');
  return {text,pages};
 }finally{if(worker)await worker.terminate();if(pdf)await pdf.destroy();}
}
