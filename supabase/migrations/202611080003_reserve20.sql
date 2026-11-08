-- Reserve is always 20% of current unreserved stock, rounded up to whole units.
create function public.pharmacy_reserve20() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin NEW.minimum:=ceil(NEW.stock::numeric/5)::integer;return NEW;end;$$;
revoke all on function public.pharmacy_reserve20() from public,anon,authenticated;
create trigger pharmacy_reserve20 before insert or update on public.pharmacy_products for each row execute function public.pharmacy_reserve20();
update public.pharmacy_products set minimum=ceil(stock::numeric/5)::integer,version=version+1 where minimum is distinct from ceil(stock::numeric/5)::integer;
create or replace function public.pharmacy_order_stock() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare line jsonb;p pharmacy_products;previous integer;used bigint;pending boolean:=false;why text:='';remaining integer;taken integer;lot pharmacy_lots;today date:=(now() at time zone 'Europe/Rome')::date;
begin
 if TG_OP='INSERT' then
  NEW.month:=to_char(today,'YYYY-MM');NEW.reserved:=false;
  perform pg_advisory_xact_lock(hashtextextended('monthly:'||NEW.user_id||':'||NEW.month,0));
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
  for line in select value from jsonb_array_elements(NEW.items::jsonb) loop
   select * into p from pharmacy_products where id=(line->>'id')::integer;
   if not found or p.configured!=1 or (line->>'qty')::integer<=0 or (line->>'qty')::integer>p.stock-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<today),0) then raise exception 'stock_unavailable';end if;
   if p.stock-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<today),0)-(line->>'qty')::integer<p.minimum then
    pending:=true;why:=why||'Riserva del 20%: '||p.name||'. ';
   end if;
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
  if not pharmacy_admin() or NEW.decided_by is distinct from auth.uid() then raise exception 'Eccezione riservata al coordinatore.';end if;
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
 else return NEW;
 end if;
 for line in select value from jsonb_array_elements(NEW.items::jsonb) loop
  select * into p from pharmacy_products where id=(line->>'id')::integer;
  remaining:=(line->>'qty')::integer;
  if p.configured!=1 or remaining<=0 or p.stock-remaining<0 then raise exception 'stock_unavailable';end if;
  -- Expired stock is quarantined. Existing stock without lot metadata remains usable.
  if p.stock-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<today),0)-remaining<0 then raise exception 'stock_unavailable';end if;
  if TG_OP='INSERT' and p.stock-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<today),0)-remaining<p.minimum then raise exception 'stock_unavailable';end if;
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

-- Keep the guarded RPC and its privacy rules; expose a separate request ceiling.
alter function public.pharmacy_data() rename to pharmacy_data_before_reserve20;
revoke all on function public.pharmacy_data_before_reserve20() from public,anon,authenticated;
create function public.pharmacy_data() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb;ps jsonb;
begin
 r:=pharmacy_data_before_reserve20();
 select coalesce(jsonb_agg(item||jsonb_build_object('requestLimit',case when p.configured=1 then greatest(0,p.stock-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<(now() at time zone 'Europe/Rome')::date),0)) else 0 end) order by item->>'name'),'[]'::jsonb)
 into ps from jsonb_array_elements(coalesce(r->'products','[]'::jsonb)) item join pharmacy_products p on p.id=(item->>'id')::integer;
 return r||jsonb_build_object('products',ps);
end;$$;
revoke all on function public.pharmacy_data() from public,anon;
grant execute on function public.pharmacy_data() to authenticated;
