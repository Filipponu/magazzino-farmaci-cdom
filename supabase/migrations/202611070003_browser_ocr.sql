-- Browser OCR is untrusted evidence; manual review remains mandatory.
alter table public.pharmacy_lots alter column expires drop not null,alter column code drop not null;
alter table public.pharmacy_lots drop constraint pharmacy_lots_code_check;
alter table public.pharmacy_lots add constraint pharmacy_lots_code_check check(code is null or length(code) between 1 and 100);
create or replace function public.pharmacy_order_stock() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare line jsonb;p pharmacy_products;previous integer;used bigint;pending boolean:=false;why text:='';remaining integer;taken integer;lot pharmacy_lots;today date:=(now() at time zone 'Europe/Rome')::date;
begin
 if TG_OP='INSERT' then
  NEW.month:=to_char(today,'YYYY-MM');NEW.reserved:=false;
  perform pg_advisory_xact_lock(hashtextextended('monthly:'||NEW.user_id||':'||NEW.month,0));
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
  for line in select value from jsonb_array_elements(NEW.items::jsonb) loop
   select * into p from pharmacy_products where id=(line->>'id')::integer;
   if not found or p.configured!=1 or (line->>'qty')::integer<=0 or p.stock-(line->>'qty')::integer<p.minimum then raise exception 'stock_unavailable';end if;
   if p.monthly_limit is not null then
    select count(*),coalesce(sum((i->>'qty')::integer) filter(where o.approval!='rejected' and o.status!='Annullato'),0) into previous,used from pharmacy_orders o cross join lateral jsonb_array_elements(o.items::jsonb)i where o.user_id=NEW.user_id and o.month=NEW.month and (i->>'id')::integer=p.id;
    if previous>0 then pending:=true;why:=why||'Richiesta successiva: '||p.name||'. ';end if;
    if used+(line->>'qty')::integer>p.monthly_limit then pending:=true;why:=why||'Limite mensile superato: '||p.name||'. ';end if;
   end if;
  end loop;
  NEW.approval:=case when pending then 'pending' else 'approved' end;NEW.approval_reason:=why;
  if pending then return NEW;end if;
 elsif NEW.status='Annullato' and OLD.status!='Annullato' then
  if not OLD.reserved then return NEW;end if;
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
  for line in select value from jsonb_array_elements(NEW.items::jsonb) loop update pharmacy_products set stock=stock+(line->>'qty')::integer,version=version+1 where id=(line->>'id')::integer;end loop;
  update pharmacy_lots l set quantity=l.quantity+a.quantity from pharmacy_allocations a where a.order_id=NEW.id and a.lot_id=l.id;
  NEW.reserved:=false;return NEW;
 elsif OLD.approval='pending' and NEW.approval='approved' then
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
 else return NEW;
 end if;
 for line in select value from jsonb_array_elements(NEW.items::jsonb) loop
  select * into p from pharmacy_products where id=(line->>'id')::integer;
  remaining:=(line->>'qty')::integer;
  if p.configured!=1 or p.stock-remaining<p.minimum then raise exception 'stock_unavailable';end if;
  -- Expired stock is quarantined. Existing stock without lot metadata remains usable.
  if p.stock-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<today),0)-remaining<p.minimum then raise exception 'stock_unavailable';end if;
  for lot in select * from pharmacy_lots where product_id=p.id and (expires is null or expires>=today) and quantity>0 order by expires,id for update loop
   taken:=least(remaining,lot.quantity);exit when taken=0;
   update pharmacy_lots set quantity=quantity-taken where id=lot.id;
   -- BEFORE INSERT cannot insert FK allocations yet; persisted by AFTER trigger below.
   perform set_config('pharmacy.allocations',(coalesce(nullif(current_setting('pharmacy.allocations',true),''),'[]')::jsonb||jsonb_build_array(jsonb_build_object('order',NEW.id,'lot',lot.id,'qty',taken)))::text,true);
   remaining:=remaining-taken;
  end loop;
  update pharmacy_products set stock=stock-(line->>'qty')::integer,version=version+1 where id=p.id;
 end loop;
 NEW.reserved:=true;return NEW;
end; $$;
create or replace function public.pharmacy_delivery(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
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
   if length(lotcode)>100 or length(coalesce(line->>'code',''))>100 or length(coalesce(line->>'description',''))>500 then raise exception 'Dati articolo non validi.';end if;
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
   if nullif(trim(line->>'lot'),'') is not null or nullif(line->>'expires','') is not null then
    insert into pharmacy_lots(product_id,supplier_id,code,expires,quantity,delivery_id) values((line->>'id')::integer,meta.supplier_id,nullif(trim(line->>'lot'),''),nullif(line->>'expires','')::date,(line->>'qty')::integer,d.id);
   end if;
  end loop;
  insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),'delivery_confirmed',d.id::text,jsonb_build_object('lines',meta.lines));return r;
 elsif payload->>'action'='ocr' then
  raise exception 'OCR eseguito nel browser: nessun servizio esterno configurato.';
 end if;
 return pharmacy_delivery_legacy(payload);
end;$$;
