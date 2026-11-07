// Run only in a trusted terminal. Credentials come exclusively from its private environment.
import {createClient} from '@supabase/supabase-js';import {randomBytes} from 'node:crypto';
const {NEXT_PUBLIC_SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key,CDOM_COORDINATOR_FIRST:first,CDOM_COORDINATOR_LAST:last}=process.env;
if(!url||!key||!first?.trim()||!last?.trim())throw Error('Configura URL, chiave server e CDOM_COORDINATOR_FIRST/LAST nell’ambiente privato del terminale.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const password=randomBytes(24).toString('base64url')+'aA9!';
const {data,error}=await db.auth.admin.createUser({email:'monica.silini@finisterre.medicair.it',password,email_confirm:true,app_metadata:{cdom_managed:true}});
if(error||!data.user)throw Error('Creazione non riuscita. Verifica che l’account non esista già.');
const profile=await db.rpc('pharmacy_bootstrap_coordinator',{target_id:data.user.id,first_name:first,last_name:last});
if(profile.error){await db.auth.admin.deleteUser(data.user.id);throw Error('Bootstrap non autorizzato: verifica migrazione e assenza di coordinatori attivi.');}
console.log('Account coordinatore creato. Consegna personalmente la password temporanea, non copiarla in chat o documenti.');console.log(password);
