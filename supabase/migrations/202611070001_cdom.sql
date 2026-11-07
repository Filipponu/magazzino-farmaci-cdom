-- Additive migration: legacy orders keep their existing reservations.
update public.pharmacy_settings set owner_email='monica.silini@finisterre.medicair.it' where id=1;
alter table public.pharmacy_products add column monthly_limit integer check(monthly_limit>0 and monthly_limit<=1000000), add column category text not null default '', add column brand text not null default '';
alter table public.pharmacy_orders add column approval text not null default 'approved' check(approval in('pending','approved','rejected')), add column approval_reason text not null default '', add column reserved boolean not null default true, add column decided_by uuid references public.pharmacy_profiles(id), add column decided_at timestamptz;
create index pharmacy_monthly on public.pharmacy_orders(user_id,month);
create table public.pharmacy_suppliers(id uuid primary key default gen_random_uuid(),name text not null check(length(trim(name)) between 1 and 120),email text not null default '',active boolean not null default true);
create unique index pharmacy_supplier_name on public.pharmacy_suppliers(lower(trim(name)));
create table public.pharmacy_articles(id uuid primary key default gen_random_uuid(),supplier_id uuid not null references public.pharmacy_suppliers(id),product_id integer not null references public.pharmacy_products(id),code text not null check(length(trim(code)) between 1 and 100),unique(supplier_id,code));
create table public.pharmacy_lots(id uuid primary key default gen_random_uuid(),product_id integer not null references public.pharmacy_products(id),supplier_id uuid references public.pharmacy_suppliers(id),code text not null check(length(code) between 1 and 100),expires date not null,quantity integer not null check(quantity>=0),delivery_id uuid references public.pharmacy_deliveries(id));
create index pharmacy_lot_fefo on public.pharmacy_lots(product_id,expires,id);
create table public.pharmacy_allocations(order_id text not null references public.pharmacy_orders(id),lot_id uuid not null references public.pharmacy_lots(id),quantity integer not null check(quantity>0),primary key(order_id,lot_id));
create table public.pharmacy_audit(id bigint generated always as identity primary key,actor uuid,action text not null,entity text not null,detail jsonb not null default '{}',created timestamptz not null default now());
create table public.pharmacy_delivery_lots(delivery_id uuid primary key references public.pharmacy_deliveries(id),supplier_id uuid not null references public.pharmacy_suppliers(id),lines jsonb not null);
create table public.pharmacy_ocr(delivery_id uuid primary key references public.pharmacy_deliveries(id),job text,status text not null check(status in('queued','running','done','failed')),result jsonb,error text,updated timestamptz not null default now());
alter table public.pharmacy_suppliers enable row level security;
alter table public.pharmacy_articles enable row level security;
alter table public.pharmacy_lots enable row level security;
alter table public.pharmacy_allocations enable row level security;
alter table public.pharmacy_audit enable row level security;
alter table public.pharmacy_delivery_lots enable row level security;
alter table public.pharmacy_ocr enable row level security;
revoke all on public.pharmacy_suppliers,public.pharmacy_articles,public.pharmacy_lots,public.pharmacy_allocations,public.pharmacy_audit,public.pharmacy_delivery_lots,public.pharmacy_ocr from anon,authenticated;

-- One lock per operator/month precedes product locks. Month is server derived;
-- history itself is the counter, so no destructive monthly reset is necessary.
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
  for lot in select * from pharmacy_lots where product_id=p.id and expires>=today and quantity>0 order by expires,id for update loop
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
-- Correctly restore reservations in BEFORE, so reserved is persisted atomically.
drop trigger pharmacy_restore on public.pharmacy_orders;
create trigger pharmacy_restore before update of status,approval on public.pharmacy_orders for each row execute function public.pharmacy_order_stock();
create function public.pharmacy_order_audit() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare a jsonb;
begin
 for a in select value from jsonb_array_elements(coalesce(nullif(current_setting('pharmacy.allocations',true),''),'[]')::jsonb) loop
  insert into pharmacy_allocations values(a->>'order',(a->>'lot')::uuid,(a->>'qty')::integer) on conflict do nothing;
 end loop;
 perform set_config('pharmacy.allocations','[]',true);
 insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),case when TG_OP='INSERT' then 'request' else 'order_update' end,NEW.id,jsonb_build_object('approval',NEW.approval,'reason',NEW.approval_reason,'status',NEW.status,'reserved',NEW.reserved));return NEW;
end; $$;
create trigger pharmacy_order_audit after insert or update on public.pharmacy_orders for each row execute function public.pharmacy_order_audit();

alter function public.pharmacy_action(jsonb) rename to pharmacy_action_legacy;
revoke all on function public.pharmacy_action_legacy(jsonb) from public,anon,authenticated;
create function public.pharmacy_action(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o pharmacy_orders;p pharmacy_products;r jsonb;s uuid;reason text:=trim(coalesce(payload->>'reason',''));
begin
 if payload->>'action' in('approve','reject','supplier','article','product','limit') then
  if not pharmacy_admin() then raise exception 'Accesso riservato ai coordinatori.';end if;
  case payload->>'action'
  when 'approve','reject' then
   select * into o from pharmacy_orders where id=payload->>'id' for update;
   if not found or o.approval!='pending' or o.status='Annullato' then raise exception 'Richiesta non più in attesa.';end if;
   if length(reason) not between 3 and 500 then raise exception 'Specifica il motivo della decisione.';end if;
   update pharmacy_orders set approval=case when payload->>'action'='approve' then 'approved' else 'rejected' end,approval_reason=approval_reason||'Decisione: '||reason,decided_by=auth.uid(),decided_at=now(),status=case when payload->>'action'='reject' then 'Annullato' else status end where id=o.id;
  when 'supplier' then
   if length(trim(coalesce(payload->>'name',''))) not between 1 and 120 or length(coalesce(payload->>'email',''))>200 then raise exception 'Fornitore non valido.';end if;
   s:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
   insert into pharmacy_suppliers(id,name,email) values(s,trim(payload->>'name'),coalesce(payload->>'email','')) on conflict(id) do update set name=excluded.name,email=excluded.email;
  when 'article' then
   insert into pharmacy_articles(supplier_id,product_id,code) values((payload->>'supplier_id')::uuid,(payload->>'product_id')::integer,trim(payload->>'code')) on conflict(supplier_id,code) do update set product_id=excluded.product_id;
  when 'product' then
   if length(trim(coalesce(payload->>'name',''))) not between 1 and 200 or length(coalesce(payload->>'unit','')) not between 1 and 60 or length(coalesce(payload->>'category',''))>100 or length(coalesce(payload->>'brand',''))>100 then raise exception 'Prodotto non valido.';end if;
   perform pg_advisory_xact_lock(hashtextextended('catalog',0));
   insert into pharmacy_products(id,name,unit,pack,category,brand) values(coalesce(nullif(payload->>'id','')::integer,(select coalesce(max(id),0)+1 from pharmacy_products)),trim(payload->>'name'),payload->>'unit',coalesce(payload->>'pack',''),coalesce(payload->>'category',''),coalesce(payload->>'brand','')) on conflict(id) do update set name=excluded.name,unit=excluded.unit,pack=excluded.pack,category=excluded.category,brand=excluded.brand;
  when 'limit' then
   update pharmacy_products set monthly_limit=nullif(payload->>'limit','')::integer where id=(payload->>'id')::integer;
   if not found then raise exception 'Prodotto non trovato.';end if;
  end case;
  insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),payload->>'action',coalesce(payload->>'id',s::text,''),payload-'action');
  return jsonb_build_object('ok',true);
 end if;
 if payload->>'action' in('ready','status') then
  select * into o from pharmacy_orders where id=payload->>'id' for update;
  if o.approval!='approved' and coalesce(payload->>'status','')!='Annullato' then raise exception 'Autorizza prima la richiesta.';end if;
 end if;
 if payload->>'action'='stock' then
  select * into p from pharmacy_products where id=(payload->>'id')::integer for update;
  if (payload->>'stock')::integer<coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id),0) then raise exception 'La giacenza non può essere inferiore al totale dei lotti.';end if;
 end if;
 r:=pharmacy_action_legacy(payload);
 if payload->>'action'!='order' then insert into pharmacy_audit(actor,action,entity) values(auth.uid(),payload->>'action',coalesce(payload->>'id',''));end if;
 return r;
end; $$;

alter function public.pharmacy_data() rename to pharmacy_data_legacy;
revoke all on function public.pharmacy_data_legacy() from public,anon,authenticated;
create function public.pharmacy_data() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb;
begin
 r:=pharmacy_data_legacy();
 if pharmacy_admin() then
  r:=r||jsonb_build_object('suppliers',(select coalesce(jsonb_agg(s order by s.name),'[]') from pharmacy_suppliers s),'articles',(select coalesce(jsonb_agg(a),'[]') from pharmacy_articles a),'lots',(select coalesce(jsonb_agg(l order by l.expires),'[]') from pharmacy_lots l),'audit',(select coalesce(jsonb_agg(a order by a.id desc),'[]') from(select * from pharmacy_audit order by id desc limit 200)a));
 end if;return r;
end; $$;
revoke all on function public.pharmacy_order_audit() from public,anon,authenticated;
revoke all on function public.pharmacy_action(jsonb),public.pharmacy_data() from public,anon;
grant execute on function public.pharmacy_action(jsonb),public.pharmacy_data() to authenticated;
