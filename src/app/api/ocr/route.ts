import {session,rpc,response,failure,origin} from '@/lib/pharmacy/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
function config(){
 const url=process.env.DOCLING_API_URL,token=process.env.DOCLING_API_TOKEN;
 if(!url||!token||token.length<32)throw Object.assign(new Error('Servizio Docling non configurato. Puoi verificare la bolla manualmente.'),{status:503});
 const parsed=new URL(url);if(parsed.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&parsed.hostname==='127.0.0.1'))throw new Error('Docling richiede HTTPS.');
 return {url:url.replace(/\/$/,''),headers:{Authorization:'Bearer '+token}};
}
async function remote(path:string,init:RequestInit={}){
 const c=config();const r=await fetch(c.url+path,{...init,headers:{...c.headers,...init.headers},signal:AbortSignal.timeout(45000),cache:'no-store',redirect:'error'});
 if(!r.ok)throw new Error(r.status===429?'Docling occupato. Riprova più tardi.':'Servizio Docling non disponibile. Il documento resta da verificare.');
 return r.json();
}
export async function POST(req:Request){try{
 origin(req);const {db}=await session();const b=await req.json();
 const d=await rpc(db,'pharmacy_delivery',{payload:{action:'file',id:b.id}});
 if(!d.uploaded||d.status!=='Da verificare'||d.mime!=='application/pdf')throw new Error('Seleziona una bolla PDF da verificare.');
 const all=await rpc(db,'pharmacy_deliveries');const current=all.deliveries.find((v:{id:string})=>v.id===d.id)?.ocr_job;
 let job;
 if(b.action==='status'){
  if(!current?.job||!/^[a-f0-9]{64}$/.test(current.job))throw new Error('Avvia prima la lettura Docling.');
  job=await remote('/jobs/'+current.job);
 }else if(b.action==='start'){
  const {data,error}=await db.storage.from('bolle').download(d.file_key);if(error)throw error;
  job=await remote('/jobs',{method:'POST',headers:{'Content-Type':'application/pdf'},body:data});
 }else throw new Error('Operazione OCR non valida.');
 await rpc(db,'pharmacy_delivery',{payload:{action:'ocr',id:d.id,...job}});
 return response(job);
}catch(e){return failure(e);}}
