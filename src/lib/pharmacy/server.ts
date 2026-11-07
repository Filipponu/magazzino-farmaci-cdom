import { createClientServer } from '@/lib/supabase/server';
export function configured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);}
export async function session(){
 if(!configured())throw Object.assign(new Error('Collegamento al database non ancora configurato.'),{status:503});
 const db=await createClientServer();const {data:{user},error}=await db.auth.getUser();
 if(error||!user)throw Object.assign(new Error('Accedi per continuare.'),{status:401});
 if(!user.email_confirmed_at)throw Object.assign(new Error('Conferma la tua email prima di accedere.'),{status:403});
 return {db,user};
}
export async function rpc(db:Awaited<ReturnType<typeof createClientServer>>,name:string,args?:Record<string,unknown>){const {data,error}=await db.rpc(name,args);if(error)throw new Error(error.message);return data;}
export function response(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}
export function failure(e:unknown){const error=e as Error&{status?:number};let m=error.message||'Operazione non riuscita.';if(m.includes('stock_unavailable'))m='Uno o più materiali non sono disponibili nelle quantità richieste. Rivedi l’ordine.';if(m.includes('duplicate_delivery')||m.includes('pharmacy_delivery_document'))m='Questa bolla è già stata caricata a magazzino.';if(m.includes('delivery_stock_invalid'))m='Verifica le giacenze e le quantità della bolla.';if(m.includes('schema cache')||m.includes('does not exist'))m='Il database deve essere inizializzato con le migrazioni del progetto.';return response({error:m},error.status||400);}
export function origin(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)throw Object.assign(new Error('Origine non valida.'),{status:403});}
