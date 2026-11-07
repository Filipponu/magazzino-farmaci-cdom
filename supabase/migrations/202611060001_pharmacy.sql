-- Shared pharmacy inventory, derived from Inventory Management (MIT).
create table public.pharmacy_settings(id integer primary key check(id=1),owner_email text,legacy_owner jsonb);
insert into public.pharmacy_settings(id) values(1);
create table public.pharmacy_profiles(id uuid primary key references auth.users(id),email text not null,first text not null,last text not null,profession text not null check(profession in ('Infermiere','OSS','Fisioterapista')),role text not null default 'operator' check(role in ('operator','coordinator')),enabled boolean not null default false,created timestamptz not null default now());
create table public.pharmacy_products(id integer primary key,name text not null,pack text not null default '',unit text not null,stock integer not null default 0 check(stock>=0),minimum integer not null default 0 check(minimum>=0),configured integer not null default 0 check(configured in(0,1)),version integer not null default 0);
create table public.pharmacy_orders(id text primary key,user_id uuid not null references public.pharmacy_profiles(id),operator text not null,profession text not null,month text not null,created timestamptz not null default now(),status text not null default 'Ricevuto' check(status in('Ricevuto','In preparazione','Pronto in farmacia','Consegnato','Annullato')),items text not null,note text not null default '');
create index pharmacy_orders_user_date on public.pharmacy_orders(user_id,created);
create table public.pharmacy_movements(id bigint generated always as identity primary key,product_id integer not null references public.pharmacy_products(id),delta integer not null,reason text not null,actor text not null,created timestamptz not null default now());
create table public.pharmacy_deliveries(id uuid primary key,supplier text not null default '',number text not null default '',date text not null default '',filename text not null,mime text not null,file_key text not null unique,hash text not null unique,size integer not null check(size>0 and size<=12582912),uploaded boolean not null default false,status text not null default 'Da verificare' check(status in('Da verificare','Caricata')),items text not null default '[]',ocr text not null default '',created timestamptz not null default now(),created_by uuid not null references public.pharmacy_profiles(id),confirmed timestamptz,confirmed_by uuid references public.pharmacy_profiles(id));
create unique index pharmacy_delivery_document on public.pharmacy_deliveries(lower(trim(supplier)),lower(trim(number)),date) where status='Caricata';
alter table public.pharmacy_settings enable row level security;
alter table public.pharmacy_profiles enable row level security;
alter table public.pharmacy_products enable row level security;
alter table public.pharmacy_orders enable row level security;
alter table public.pharmacy_movements enable row level security;
alter table public.pharmacy_deliveries enable row level security;
revoke all on public.pharmacy_settings,public.pharmacy_profiles,public.pharmacy_products,public.pharmacy_orders,public.pharmacy_movements,public.pharmacy_deliveries from anon,authenticated;
create function public.pharmacy_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from pharmacy_profiles where id=auth.uid() and role='coordinator' and enabled); $$;
create function public.pharmacy_order_stock() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare line jsonb; p pharmacy_products;
begin
 if TG_OP='INSERT' then
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
  for line in select value from jsonb_array_elements(NEW.items::jsonb) loop
   select * into p from pharmacy_products where id=(line->>'id')::integer;
   if not found or p.configured!=1 or (line->>'qty')::integer<=0 or p.stock<=p.minimum or p.stock-(line->>'qty')::integer<p.minimum then raise exception 'stock_unavailable'; end if;
   update pharmacy_products set stock=stock-(line->>'qty')::integer,version=version+1 where id=p.id;
  end loop;
 elsif NEW.status='Annullato' and OLD.status!='Annullato' then
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
  for line in select value from jsonb_array_elements(NEW.items::jsonb) loop update pharmacy_products set stock=stock+(line->>'qty')::integer,version=version+1 where id=(line->>'id')::integer; end loop;
 end if;
 return NEW;
end; $$;
create trigger pharmacy_reserve before insert on public.pharmacy_orders for each row execute function public.pharmacy_order_stock();
create trigger pharmacy_restore after update of status on public.pharmacy_orders for each row execute function public.pharmacy_order_stock();
create function public.pharmacy_movement() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin
 if NEW.stock!=OLD.stock then insert into pharmacy_movements(product_id,delta,reason,actor) values(NEW.id,NEW.stock-OLD.stock,case when NEW.stock<OLD.stock then 'Scarico / riserva ordine' else 'Carico / ripristino' end,coalesce(auth.uid()::text,'Migrazione')); end if;return NEW;end; $$;
create trigger pharmacy_movement after update of stock on public.pharmacy_products for each row execute function public.pharmacy_movement();
create function public.pharmacy_delivery_load() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare line jsonb;p pharmacy_products;
begin
 if NEW.status='Caricata' and OLD.status!='Caricata' then
  if not NEW.uploaded or jsonb_array_length(NEW.items::jsonb)=0 then raise exception 'delivery_stock_invalid';end if;
  perform pg_advisory_xact_lock(hashtextextended(lower(trim(NEW.supplier))||':'||lower(trim(NEW.number))||':'||NEW.date,0));
  if exists(select 1 from pharmacy_deliveries where id!=NEW.id and status='Caricata' and lower(trim(supplier))=lower(trim(NEW.supplier)) and lower(trim(number))=lower(trim(NEW.number)) and date=NEW.date) then raise exception 'duplicate_delivery';end if;
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
  for line in select value from jsonb_array_elements(NEW.items::jsonb) loop
   select * into p from pharmacy_products where id=(line->>'id')::integer;
   if not found or p.configured!=1 or (line->>'qty')::integer<=0 or p.stock+(line->>'qty')::integer>1000000 then raise exception 'delivery_stock_invalid';end if;
   update pharmacy_products set stock=stock+(line->>'qty')::integer,version=version+1 where id=p.id;
   update pharmacy_movements set reason='Bolla '||NEW.number||' - '||NEW.supplier where id=(select max(id) from pharmacy_movements where product_id=p.id);
  end loop;
 end if;return NEW;
end; $$;
create trigger pharmacy_delivery_load before update of status on public.pharmacy_deliveries for each row execute function public.pharmacy_delivery_load();
create function public.pharmacy_data() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u pharmacy_profiles;a boolean;ps jsonb;os jsonb;us jsonb;ms jsonb;
begin
 if auth.uid() is null then raise exception 'Accesso richiesto.';end if;
 select * into u from pharmacy_profiles where id=auth.uid();
 if not found then return jsonb_build_object('user',null,'products','[]'::jsonb,'orders','[]'::jsonb,'users','[]'::jsonb,'movements','[]'::jsonb,'updated',now());end if;
 if not u.enabled then return jsonb_build_object('user',to_jsonb(u),'products','[]'::jsonb,'orders','[]'::jsonb,'users','[]'::jsonb,'movements','[]'::jsonb,'updated',now());end if;
 a:=pharmacy_admin();
 select coalesce(jsonb_agg(case when a then to_jsonb(p) else jsonb_build_object('id',p.id,'name',p.name,'pack',p.pack,'unit',p.unit,'orderLimit',case when p.configured=1 then greatest(0,p.stock-p.minimum) else 0 end) end order by p.name),'[]'::jsonb) into ps from pharmacy_products p;
 select coalesce(jsonb_agg(to_jsonb(o) order by o.created desc),'[]'::jsonb) into os from (select * from pharmacy_orders where a or user_id=auth.uid() order by created desc limit 500)o;
 if a then
  select coalesce(jsonb_agg(to_jsonb(p) order by p.last,p.first),'[]'::jsonb) into us from pharmacy_profiles p;
  select coalesce(jsonb_agg(to_jsonb(m) order by m.id desc),'[]'::jsonb) into ms from (select m.*,p.name from pharmacy_movements m join pharmacy_products p on p.id=m.product_id order by m.id desc limit 100)m;
 end if;
 return jsonb_build_object('user',to_jsonb(u),'products',ps,'orders',os,'users',coalesce(us,'[]'::jsonb),'movements',coalesce(ms,'[]'::jsonb),'updated',now());
end; $$;
create function public.pharmacy_action(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u pharmacy_profiles;setting pharmacy_settings;line jsonb;p pharmacy_products;built_items jsonb:='[]';oid text;existing pharmacy_orders;r uuid;f text;l text;job text;v integer;
begin
 if auth.uid() is null then raise exception 'Accesso richiesto.';end if;
 select * into u from pharmacy_profiles where id=auth.uid();
 if payload->>'action'='register' then
  if u.id is not null then raise exception 'Profilo già registrato.';end if;
  f:=trim(payload->>'first');l:=trim(payload->>'last');job:=payload->>'profession';
  if f is null or l is null or length(f) not between 1 and 60 or length(l) not between 1 and 60 or job is null or job not in('Infermiere','OSS','Fisioterapista') then raise exception 'Inserisci nome, cognome e professione.';end if;
  select * into setting from pharmacy_settings where id=1;
  if setting.owner_email is null then raise exception 'Il coordinatore principale deve essere configurato prima della registrazione.';end if;
  if lower(auth.jwt()->>'email')=lower(setting.owner_email) and setting.legacy_owner is not null then f:=setting.legacy_owner->>'first';l:=setting.legacy_owner->>'last';job:=setting.legacy_owner->>'profession';end if;
  insert into pharmacy_profiles(id,email,first,last,profession,role,enabled) values(auth.uid(),auth.jwt()->>'email',f,l,job,case when lower(auth.jwt()->>'email')=lower(setting.owner_email) then 'coordinator' else 'operator' end,lower(auth.jwt()->>'email')=lower(setting.owner_email));
  return jsonb_build_object('ok',true);
 end if;
 if u.id is null then raise exception 'Completa il profilo.';end if;
 if not u.enabled then raise exception 'Il coordinatore deve autorizzare il tuo accesso.';end if;
 if payload->>'action'='order' then
  oid:=payload->>'id';
  if oid is null or oid!~'^[a-f0-9-]{36}$' or coalesce(payload->>'month','')!~'^\d{4}-(0[1-9]|1[0-2])$' or jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 300 or coalesce(length(payload->>'note'),501)>500 then raise exception 'Ordine non valido.';end if;
  perform pg_advisory_xact_lock(hashtextextended('order:'||oid,0));
  select * into existing from pharmacy_orders where id=oid;
  if found then if existing.user_id!=u.id then raise exception 'Ordine non accessibile.';end if;return jsonb_build_object('ok',true);end if;
  if (select count(*) from jsonb_array_elements(payload->'items'))!=(select count(distinct value->>'id') from jsonb_array_elements(payload->'items')) then raise exception 'Materiale ripetuto.';end if;
  for line in select value from jsonb_array_elements(payload->'items') loop
   if coalesce(line->>'qty','')!~'^[1-9][0-9]{0,6}$' or (line->>'qty')::integer>1000000 or coalesce(line->>'id','')!~'^[0-9]{1,7}$' then raise exception 'Quantità non valida.';end if;
   select * into p from pharmacy_products where id=(line->>'id')::integer;
   if not found then raise exception 'Materiale non trovato.';end if;
   built_items:=built_items||jsonb_build_array(jsonb_build_object('id',p.id,'name',p.name,'pack',p.pack,'unit',p.unit,'qty',(line->>'qty')::integer));
  end loop;
  insert into pharmacy_orders(id,user_id,operator,profession,month,items,note) values(oid,u.id,u.first||' '||u.last,u.profession,payload->>'month',built_items::text,trim(payload->>'note'));
  return jsonb_build_object('ok',true);
 end if;
 if not pharmacy_admin() then raise exception 'Accesso riservato ai coordinatori.';end if;
 case payload->>'action'
 when 'seed' then return jsonb_build_object('ok',true);
 when 'stock' then
  if coalesce(payload->>'stock','')!~'^[0-9]{1,7}$' or coalesce(payload->>'minimum','')!~'^[0-9]{1,7}$' or (payload->>'stock')::integer>1000000 or (payload->>'minimum')::integer>1000000 then raise exception 'Inserisci quantità intere valide.';end if;
  update pharmacy_products set stock=(payload->>'stock')::integer,minimum=(payload->>'minimum')::integer,configured=1,version=version+1 where id=(payload->>'id')::integer and version=(payload->>'version')::integer returning id into v;
  if not found then raise exception 'Giacenza aggiornata da un altro utente. Ricarica e riprova.';end if;
 when 'ready' then
  select * into existing from pharmacy_orders where id=payload->>'id' for update;
  if not found or existing.status not in('Ricevuto','In preparazione','Pronto in farmacia') then raise exception 'Questo ordine non può essere segnalato come pronto.';end if;
  update pharmacy_orders set status='Pronto in farmacia' where id=existing.id;
 when 'status' then
  if coalesce(payload->>'status','') not in('In preparazione','Consegnato','Annullato') then raise exception 'Stato non valido.';end if;
  update pharmacy_orders set status=payload->>'status' where id=payload->>'id' and status not in('Consegnato','Annullato') and (payload->>'status'!='In preparazione' or status!='Pronto in farmacia');
  if not found then raise exception 'Ordine già chiuso o non trovato.';end if;
 when 'role','access' then
  select owner_email into f from pharmacy_settings where id=1;
  if exists(select 1 from pharmacy_profiles where id=(payload->>'id')::uuid and lower(email)=lower(f)) then raise exception 'Il coordinatore principale mantiene il suo accesso.';end if;
  if payload->>'action'='role' then
   if coalesce(payload->>'role','') not in('operator','coordinator') then raise exception 'Ruolo non valido.';end if;
   update pharmacy_profiles set role=payload->>'role' where id=(payload->>'id')::uuid;
  else
   if jsonb_typeof(payload->'enabled') is distinct from 'boolean' then raise exception 'Accesso non valido.';end if;
   update pharmacy_profiles set enabled=(payload->>'enabled')::boolean where id=(payload->>'id')::uuid;
  end if;
 else raise exception 'Operazione non riconosciuta.';
 end case;
 return jsonb_build_object('ok',true);
end; $$;
create function public.pharmacy_order(order_id text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$ declare o pharmacy_orders;begin
 select * into o from pharmacy_orders where id=order_id;
 if not found or not exists(select 1 from pharmacy_profiles where id=auth.uid() and enabled) or (o.user_id!=auth.uid() and not pharmacy_admin()) then raise exception 'Ordine non accessibile.';end if;return to_jsonb(o);end; $$;
create function public.pharmacy_deliveries() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$ declare r jsonb;begin
 if not pharmacy_admin() then raise exception 'Bolle riservate ai coordinatori.';end if;
 select coalesce(jsonb_agg(to_jsonb(d) order by d.created desc),'[]'::jsonb) into r from (select * from pharmacy_deliveries where uploaded order by created desc limit 200)d;
 return jsonb_build_object('deliveries',r);end; $$;
create function public.pharmacy_delivery(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d pharmacy_deliveries;line jsonb;p pharmacy_products;built_items jsonb:='[]';did uuid;
begin
 if not pharmacy_admin() then raise exception 'Bolle riservate ai coordinatori.';end if;
 if payload->>'action'='ticket' then
  if coalesce(payload->>'hash','')!~'^[a-f0-9]{64}$' or coalesce(payload->>'size','')!~'^[0-9]{1,8}$' or (payload->>'size')::integer not between 1 and 12582912 or coalesce(payload->>'mime','') not in('application/pdf','image/jpeg','image/png','image/webp') or coalesce(length(payload->>'filename'),0) not between 1 and 180 then raise exception 'Allegato non valido.';end if;
  perform pg_advisory_xact_lock(hashtextextended(payload->>'hash',0));
  select * into d from pharmacy_deliveries where hash=payload->>'hash';
  if found then return to_jsonb(d)||jsonb_build_object('duplicate',d.uploaded);end if;
  did:=gen_random_uuid();
  insert into pharmacy_deliveries(id,filename,mime,file_key,hash,size,created_by) values(did,payload->>'filename',payload->>'mime','deliveries/'||did,payload->>'hash',(payload->>'size')::integer,auth.uid()) returning * into d;
  return to_jsonb(d)||jsonb_build_object('duplicate',false);
 end if;
 select * into d from pharmacy_deliveries where id=(payload->>'id')::uuid for update;
 if not found then raise exception 'Bolla non trovata.';end if;
 if payload->>'action'='file' then return to_jsonb(d);end if;
 -- Upload finalization is server-verified via object contents; only the upload initiator may finalize.
 if payload->>'action'='uploaded' then
  if d.created_by!=auth.uid() then raise exception 'Caricamento riservato al coordinatore che lo ha iniziato.';end if;
  if not exists(select 1 from storage.objects where bucket_id='bolle' and name=d.file_key) then raise exception 'Completa il caricamento del file.';end if;
  update pharmacy_deliveries set uploaded=true where id=d.id;return jsonb_build_object('ok',true);
 end if;
 if not d.uploaded then raise exception 'Completa il caricamento del documento.';end if;
 if payload->>'action'='review' then
  if d.status!='Da verificare' then raise exception 'Bolla già caricata.';end if;
  if coalesce(length(trim(payload->>'supplier')),0) not between 1 and 120 or coalesce(length(trim(payload->>'number')),0) not between 1 and 80 or coalesce(payload->>'date','')!~'^\d{4}-\d{2}-\d{2}$' or (payload->>'date')::date::text!=payload->>'date' or jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 300 or coalesce(length(payload->>'ocr'),80001)>80000 then raise exception 'Completa ditta, numero, data e materiali ricevuti.';end if;
  if (select count(*) from jsonb_array_elements(payload->'items'))!=(select count(distinct value->>'id') from jsonb_array_elements(payload->'items')) then raise exception 'Materiale ripetuto.';end if;
  for line in select value from jsonb_array_elements(payload->'items') loop
   if coalesce(line->>'qty','')!~'^[1-9][0-9]{0,6}$' or (line->>'qty')::integer>1000000 or coalesce(line->>'id','')!~'^[0-9]{1,7}$' then raise exception 'Quantità non valida.';end if;
   select * into p from pharmacy_products where id=(line->>'id')::integer;
   if not found or p.configured!=1 then raise exception 'Configura prima giacenza e soglia minima del materiale nel magazzino.';end if;
   built_items:=built_items||jsonb_build_array(jsonb_build_object('id',p.id,'name',p.name,'pack',p.pack,'unit',p.unit,'qty',(line->>'qty')::integer));
  end loop;
  update pharmacy_deliveries set supplier=trim(payload->>'supplier'),number=trim(payload->>'number'),date=payload->>'date',items=built_items::text,ocr=payload->>'ocr' where id=d.id;
 elsif payload->>'action'='confirm' then
  if d.status='Caricata' then return jsonb_build_object('ok',true,'already',true);end if;
  if d.supplier='' or d.number='' or d.date='' or jsonb_array_length(d.items::jsonb)=0 then raise exception 'Verifica e salva prima i dati della bolla.';end if;
  if coalesce(payload->'review'->>'supplier','')!=d.supplier or coalesce(payload->'review'->>'number','')!=d.number or coalesce(payload->'review'->>'date','')!=d.date or coalesce(payload->'review'->>'items','')!=d.items then raise exception 'La bolla è stata modificata. Riaprila e verifica i dati aggiornati.';end if;
  update pharmacy_deliveries set status='Caricata',confirmed=now(),confirmed_by=auth.uid() where id=d.id;
 else raise exception 'Operazione non riconosciuta.';
 end if;
 return jsonb_build_object('ok',true);
end; $$;
-- Private original documents. Upload directly to Storage to avoid Vercel request-size limits.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('bolle','bolle',false,12582912,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy pharmacy_bolle_read on storage.objects for select to authenticated using(bucket_id='bolle' and public.pharmacy_admin());
create policy pharmacy_bolle_insert on storage.objects for insert to authenticated with check(bucket_id='bolle' and public.pharmacy_admin() and exists(select 1 from public.pharmacy_deliveries d where d.file_key=name and not d.uploaded and d.created_by=auth.uid()));
create policy pharmacy_bolle_cleanup on storage.objects for delete to authenticated using(bucket_id='bolle' and public.pharmacy_admin() and exists(select 1 from public.pharmacy_deliveries d where d.file_key=name and not d.uploaded and d.created_by=auth.uid()));
-- Policies require only the current coordinator's draft file paths; no table access is granted.
-- SECURITY DEFINER helper prevents policy subqueries from requiring direct table access.
create function public.pharmacy_own_draft(path text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select pharmacy_admin() and exists(select 1 from pharmacy_deliveries d where d.file_key=path and not d.uploaded and d.created_by=auth.uid()); $$;
drop policy pharmacy_bolle_insert on storage.objects;
drop policy pharmacy_bolle_cleanup on storage.objects;
create policy pharmacy_bolle_insert on storage.objects for insert to authenticated with check(bucket_id='bolle' and public.pharmacy_own_draft(name));
create policy pharmacy_bolle_cleanup on storage.objects for delete to authenticated using(bucket_id='bolle' and public.pharmacy_own_draft(name));
revoke all on function public.pharmacy_order_stock(),public.pharmacy_movement(),public.pharmacy_delivery_load() from public,anon,authenticated;
revoke all on function public.pharmacy_admin(),public.pharmacy_data(),public.pharmacy_action(jsonb),public.pharmacy_order(text),public.pharmacy_deliveries(),public.pharmacy_delivery(jsonb),public.pharmacy_own_draft(text) from public,anon;
grant execute on function public.pharmacy_admin(),public.pharmacy_data(),public.pharmacy_action(jsonb),public.pharmacy_order(text),public.pharmacy_deliveries(),public.pharmacy_delivery(jsonb),public.pharmacy_own_draft(text) to authenticated;
