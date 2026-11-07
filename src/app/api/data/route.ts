import {session,rpc,response,failure,origin} from '@/lib/pharmacy/server';
import {orderPdf} from '../../pdf';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(req:Request){try{const {db}=await session();const id=new URL(req.url).searchParams.get('pdf');if(id){const o=await rpc(db,'pharmacy_order',{order_id:id});return new Response(Buffer.from(orderPdf(o)),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="ordine-'+o.id+'.pdf"','Cache-Control':'no-store'}});}return response(await rpc(db,'pharmacy_data'));}catch(e){return failure(e);}}
export async function POST(req:Request){try{origin(req);const {db}=await session();return response(await rpc(db,'pharmacy_action',{payload:await req.json()}));}catch(e){return failure(e);}}
