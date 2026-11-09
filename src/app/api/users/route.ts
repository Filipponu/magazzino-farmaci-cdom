import 'server-only';
import {randomBytes,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {session,origin,response,rpc} from '@/lib/pharmacy/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 try{
  origin(req);const {db,user}=await session();
  if(!await rpc(db,'pharmacy_admin'))return response({error:'Accesso riservato ai coordinatori attivi.'},403);
  const b=await req.json();
  if(typeof b.current_password!=='string'||b.current_password.length>256)return response({error:'Conferma la tua password.'},400);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const verify=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const check=await verify.auth.signInWithPassword({email:user.email!,password:b.current_password});
  if(check.error)return response({error:'Password del coordinatore non valida.'},403);
  await verify.auth.signOut({scope:'local'});
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)return response({error:'Gestione account non ancora configurata sul server.'},503);
  const service=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const password=randomBytes(24).toString('base64url')+'aA9!';
  if(b.action==='create'){
   if(b.roles!==undefined&&(!Array.isArray(b.roles)||b.roles.length<1||b.roles.length>2||new Set(b.roles).size!==b.roles.length||!b.roles.every((role:unknown)=>role==='coordinator'||role==='operator')||!b.roles.includes(b.role)))return response({error:'Verifica i ruoli del nuovo account.'},400);
   if(typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email)||b.email.length>254||
    !['first','last'].every(k=>typeof b[k]==='string'&&b[k].trim().length>0&&b[k].trim().length<=60)||
    !['Infermiere','OSS','Fisioterapista'].includes(b.profession)||!['coordinator','operator'].includes(b.role))return response({error:'Verifica i dati del nuovo account.'},400);
   const email=b.email.trim().toLowerCase();
   const result=await service.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{cdom_managed:true}});
   if(result.error||!result.data.user)return response({error:'Creazione non riuscita: verifica che l’email non sia già utilizzata.'},400);
   const id=result.data.user.id;
   const profile=await service.rpc('pharmacy_manage_account',{actor_id:user.id,target_id:id,operation:'create',details:{email,first:b.first,last:b.last,profession:b.profession,role:b.role,...(b.roles?{roles:b.roles}:{})}});
   if(profile.error){await service.auth.admin.deleteUser(id);return response({error:'Creazione del profilo non riuscita.'},400);}
   return response({password,email});
  }
  if(b.action==='reset'&&typeof b.id==='string'&&/^[0-9a-f-]{36}$/i.test(b.id)&&b.id!==user.id){
   const guard=await service.rpc('pharmacy_manage_account',{actor_id:user.id,target_id:b.id,operation:'reset'});
   if(guard.error)return response({error:'Ripristino non autorizzato.'},403);
   const result=await service.auth.admin.updateUserById(b.id,{password,app_metadata:{cdom_reset_nonce:randomUUID()}});
   if(result.error)return response({error:'Account bloccato per ripristino. Ripeti l’operazione.'},400);
   const revoked=await service.rpc('pharmacy_manage_account',{actor_id:user.id,target_id:b.id,operation:'reset_done'});
   if(revoked.error)return response({error:'Ripristino da completare. Ripeti l’operazione.'},400);
   return response({password});
  }
  return response({error:'Operazione non valida.'},400);
 }catch{return response({error:'Operazione non riuscita. Riprova.'},400);}
}
