-- Password state follows GoTrue's encrypted password, never client metadata.
alter table public.pharmacy_profiles add column password_change_required boolean not null default true;
create function public.pharmacy_password_changed() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if NEW.encrypted_password is distinct from OLD.encrypted_password and length(coalesce(NEW.encrypted_password,''))>0 then
  update pharmacy_profiles set password_change_required=false where id=NEW.id;
  insert into pharmacy_audit(actor,action,entity) values(NEW.id,'password_changed',NEW.id::text);
 end if;return NEW;
end; $$;
create trigger pharmacy_password_changed after update of encrypted_password on auth.users for each row execute function public.pharmacy_password_changed();
revoke all on function public.pharmacy_password_changed() from public,anon,authenticated;
create function public.pharmacy_password_ok() returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select exists(select 1 from pharmacy_profiles where id=auth.uid() and not password_change_required); $$;
-- All public RPC entry points are guarded, including direct PostgREST calls.
alter function public.pharmacy_admin() rename to pharmacy_admin_role;
revoke all on function public.pharmacy_admin_role() from public,anon,authenticated;
create function public.pharmacy_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$select pharmacy_password_ok() and pharmacy_admin_role();$$;
-- Policies bind function OIDs: explicitly rebind after the guarded wrapper rename.
alter policy pharmacy_bolle_read on storage.objects using(bucket_id='bolle' and public.pharmacy_admin());
create or replace function public.pharmacy_own_draft(path text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select pharmacy_admin() and exists(select 1 from pharmacy_deliveries d where d.file_key=path and not d.uploaded and d.created_by=auth.uid());$$;
alter function public.pharmacy_action(jsonb) rename to pharmacy_action_cdom;
revoke all on function public.pharmacy_action_cdom(jsonb) from public,anon,authenticated;
create function public.pharmacy_action(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$begin
 if payload->>'action'!='register' and not pharmacy_password_ok() then raise exception 'Imposta una nuova password prima di continuare.';end if;
 return pharmacy_action_cdom(payload);
end;$$;
alter function public.pharmacy_data() rename to pharmacy_data_cdom;
revoke all on function public.pharmacy_data_cdom() from public,anon,authenticated;
create function public.pharmacy_data() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare u pharmacy_profiles;r jsonb;begin
 select * into u from pharmacy_profiles where id=auth.uid();
 if u.id is not null and not pharmacy_password_ok() then return jsonb_build_object('user',to_jsonb(u),'products','[]'::jsonb,'orders','[]'::jsonb,'updated',now());end if;
 r:=pharmacy_data_cdom();
 if pharmacy_admin() then
  r:=r||jsonb_build_object('recent_deliveries',(select coalesce(jsonb_agg(d),'[]') from(select id,supplier,number,date,status from pharmacy_deliveries where uploaded order by created desc limit 5)d),'top_products',(select coalesce(jsonb_agg(t),'[]') from(select p.name,sum((i->>'qty')::integer) quantity from pharmacy_orders o cross join lateral jsonb_array_elements(o.items::jsonb)i join pharmacy_products p on p.id=(i->>'id')::integer where o.approval='approved' and o.status!='Annullato' and o.month=to_char(now() at time zone 'Europe/Rome','YYYY-MM') group by p.name order by quantity desc limit 5)t));
 elsif u.enabled then
  r:=r||jsonb_build_object('products',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'pack',p.pack,'unit',p.unit,'category',p.category,'orderLimit',case when p.configured=1 then greatest(0,p.stock-p.minimum-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<(now() at time zone 'Europe/Rome')::date),0)) else 0 end) order by p.name),'[]') from pharmacy_products p));
 end if;return r;end;$$;
alter function public.pharmacy_order(text) rename to pharmacy_order_legacy;
revoke all on function public.pharmacy_order_legacy(text) from public,anon,authenticated;
create function public.pharmacy_order(order_id text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$begin
 if not pharmacy_password_ok() then raise exception 'Imposta una nuova password prima di continuare.';end if;return pharmacy_order_legacy(order_id);end;$$;

-- Keep original verified upload / stock load semantics. OCR results are a separate
-- untrusted workspace and have no path to confirm or update stock.
alter table public.pharmacy_deliveries add column supplier_id uuid references public.pharmacy_suppliers(id);
create unique index pharmacy_delivery_supplier_document on public.pharmacy_deliveries(supplier_id,lower(trim(number)),date) where status='Caricata';
alter function public.pharmacy_delivery(jsonb) rename to pharmacy_delivery_legacy;
revoke all on function public.pharmacy_delivery_legacy(jsonb) from public,anon,authenticated;
create function public.pharmacy_delivery(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d pharmacy_deliveries;meta pharmacy_delivery_lots;line jsonb;grouped jsonb;r jsonb;sid uuid;lotcode text;expiry date;
begin
 if not pharmacy_admin() then raise exception 'Bolle riservate ai coordinatori.';end if;
 if payload->>'action' in('review','confirm') then
  select * into d from pharmacy_deliveries where id=(payload->>'id')::uuid for update;
  if not found then raise exception 'Bolla non trovata.';end if;
 end if;
 if payload->>'action'='review' and payload ? 'supplier_id' then
  sid:=(payload->>'supplier_id')::uuid;
  if not exists(select 1 from pharmacy_suppliers where id=sid and active) then raise exception 'Seleziona il fornitore commerciale.';end if;
  if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 300 then raise exception 'Righe non valide.';end if;
  for line in select value from jsonb_array_elements(payload->'items') loop
   if coalesce(line->>'qty','')!~'^[1-9][0-9]{0,5}$' or coalesce(line->>'id','')!~'^[0-9]{1,7}$' then raise exception 'Quantità non valida.';end if;
   lotcode:=trim(coalesce(line->>'lot',''));expiry:=nullif(line->>'expires','')::date;
   if length(lotcode) not between 1 and 100 or expiry is null then raise exception 'Completa lotto e scadenza di ogni riga.';end if;
  end loop;
  select jsonb_agg(jsonb_build_object('id',id,'qty',qty)) into grouped from(select (value->>'id')::integer id,sum((value->>'qty')::integer) qty from jsonb_array_elements(payload->'items') group by (value->>'id')::integer)t;
  r:=pharmacy_delivery_legacy(payload||jsonb_build_object('supplier',(select name from pharmacy_suppliers where id=sid),'items',grouped));
  update pharmacy_deliveries set supplier_id=sid where id=d.id;
  insert into pharmacy_delivery_lots values(d.id,sid,payload->'items') on conflict(delivery_id) do update set supplier_id=excluded.supplier_id,lines=excluded.lines;
  return r;
 elsif payload->>'action'='review' then
  raise exception 'Seleziona fornitore, lotti e scadenze prima di salvare.';
 elsif payload->>'action'='confirm' then
  if d.status='Caricata' then return jsonb_build_object('ok',true,'already',true);end if;
  select * into meta from pharmacy_delivery_lots where delivery_id=d.id;
  if not found then raise exception 'Verifica fornitore, lotti e scadenze.';end if;
  if payload->'review'->'lot_review' is distinct from meta.lines or payload->'review'->>'supplier_id' is distinct from meta.supplier_id::text then raise exception 'Lotti modificati: riapri e verifica la bolla.';end if;
  r:=pharmacy_delivery_legacy(payload);
  for line in select value from jsonb_array_elements(meta.lines) loop
   insert into pharmacy_lots(product_id,supplier_id,code,expires,quantity,delivery_id) values((line->>'id')::integer,meta.supplier_id,line->>'lot',(line->>'expires')::date,(line->>'qty')::integer,d.id);
  end loop;
  insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),'delivery_confirmed',d.id::text,jsonb_build_object('lines',meta.lines));return r;
 elsif payload->>'action'='ocr' then
  select * into d from pharmacy_deliveries where id=(payload->>'id')::uuid for update;
  if not found or not d.uploaded or d.status!='Da verificare' then raise exception 'Documento non disponibile per OCR.';end if;
  insert into pharmacy_ocr(delivery_id,job,status,result,error) values(d.id,payload->>'job',payload->>'status',payload->'result',left(payload->>'error',500)) on conflict(delivery_id) do update set job=excluded.job,status=excluded.status,result=excluded.result,error=excluded.error,updated=now();return jsonb_build_object('ok',true);
 end if;
 return pharmacy_delivery_legacy(payload);
end;$$;
create or replace function public.pharmacy_deliveries() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare r jsonb;begin
 if not pharmacy_admin() then raise exception 'Bolle riservate ai coordinatori.';end if;
 select coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('supplier_id',m.supplier_id,'lot_review',m.lines,'ocr_job',to_jsonb(j)) order by d.created desc),'[]') into r from(select * from pharmacy_deliveries where uploaded order by created desc limit 200)d left join pharmacy_delivery_lots m on m.delivery_id=d.id left join pharmacy_ocr j on j.delivery_id=d.id;
 return jsonb_build_object('deliveries',r);end;$$;
revoke all on function public.pharmacy_password_ok(),public.pharmacy_admin(),public.pharmacy_action(jsonb),public.pharmacy_data(),public.pharmacy_order(text),public.pharmacy_delivery(jsonb),public.pharmacy_deliveries() from public,anon;
grant execute on function public.pharmacy_password_ok(),public.pharmacy_admin(),public.pharmacy_action(jsonb),public.pharmacy_data(),public.pharmacy_order(text),public.pharmacy_delivery(jsonb),public.pharmacy_deliveries() to authenticated;
