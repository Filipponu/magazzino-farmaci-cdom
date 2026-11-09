-- Additive migration: existing profiles, Auth accounts and historical reservations remain.
create table public.user_roles (
 user_id uuid not null references public.pharmacy_profiles(id) on delete cascade,
 role text not null check(role in('coordinator','operator')),
 created_at timestamptz not null default now(),
 primary key(user_id,role)
);
insert into public.user_roles(user_id,role) select id,role from public.pharmacy_profiles;
-- Existing coordinators already had an operator view; retain that capability.
insert into public.user_roles(user_id,role) select id,'operator' from public.pharmacy_profiles where role='coordinator' on conflict do nothing;
alter table public.user_roles enable row level security;
revoke all on public.user_roles from public,anon,authenticated;
grant select on public.user_roles to authenticated;
alter table public.pharmacy_profiles add column preferred_mode text check(preferred_mode in('coordinator','operator'));
alter table public.pharmacy_settings add column allow_coordinator_self_preparation boolean not null default false;
alter table public.pharmacy_orders add column personal_coordinator boolean not null default false,
 add column prepared_by uuid references public.pharmacy_profiles(id),add column prepared_at timestamptz;

create or replace function public.pharmacy_admin_role() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from pharmacy_profiles p join user_roles r on r.user_id=p.id where p.id=auth.uid() and p.enabled and r.role='coordinator');
$$;
create function public.pharmacy_has_role(wanted text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select pharmacy_password_ok() and exists(select 1 from user_roles where user_id=auth.uid() and role=wanted);
$$;
revoke all on function public.pharmacy_has_role(text) from public,anon;
grant execute on function public.pharmacy_has_role(text) to authenticated;
create policy user_roles_read on public.user_roles for select to authenticated using(pharmacy_password_ok() and (user_id=auth.uid() or pharmacy_admin()));
grant select on public.pharmacy_profiles,public.pharmacy_orders to authenticated;
create policy pharmacy_profiles_read on public.pharmacy_profiles for select to authenticated using(pharmacy_password_ok() and (id=auth.uid() or pharmacy_admin()));
create policy pharmacy_orders_read on public.pharmacy_orders for select to authenticated using(pharmacy_password_ok() and (user_id=auth.uid() or pharmacy_admin()));

-- The old scalar role is a compatibility projection. New authorization uses user_roles.
create function public.pharmacy_profile_roles_sync() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into user_roles(user_id,role) values(NEW.id,NEW.role) on conflict do nothing;
 if TG_OP='UPDATE' and NEW.role='operator' and OLD.role='coordinator' then delete from user_roles where user_id=NEW.id and role='coordinator';end if;
 return NEW;
end;$$;
create trigger pharmacy_profile_roles_sync after insert or update of role on public.pharmacy_profiles for each row execute function public.pharmacy_profile_roles_sync();
create function public.pharmacy_roles_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare projected text;
begin
 perform 1 from pharmacy_settings where id=1 for update;
 if TG_WHEN='BEFORE' then
  if OLD.role='coordinator' and exists(select 1 from pharmacy_profiles where id=OLD.user_id and enabled) and not exists(
   select 1 from user_roles r join pharmacy_profiles p on p.id=r.user_id where r.role='coordinator' and p.enabled and p.id<>OLD.user_id
  ) then raise exception 'Deve rimanere almeno un coordinatore attivo.';end if;
  return OLD;
 end if;
 projected:=case when exists(select 1 from user_roles where user_id=coalesce(NEW.user_id,OLD.user_id) and role='coordinator') then 'coordinator' else 'operator' end;
 update pharmacy_profiles set role=projected where id=coalesce(NEW.user_id,OLD.user_id) and role<>projected;
 return coalesce(NEW,OLD);
end;$$;
create trigger pharmacy_roles_guard before delete on public.user_roles for each row execute function public.pharmacy_roles_guard();
create trigger pharmacy_roles_project after insert or delete on public.user_roles for each row execute function public.pharmacy_roles_guard();
revoke all on function public.pharmacy_profile_roles_sync(),public.pharmacy_roles_guard() from public,anon,authenticated;

alter function public.pharmacy_action(jsonb) rename to pharmacy_action_before_dual;
revoke all on function public.pharmacy_action_before_dual(jsonb) from public,anon,authenticated;
create function public.pharmacy_action(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare target uuid;rs jsonb;old_roles jsonb;setting boolean;reason text;requested text;
begin
 if payload->>'action'='register' then raise exception 'Rivolgiti al coordinatore';end if;
 if not pharmacy_password_ok() then raise exception 'Accesso attivo e password personale richiesti.';end if;
 if payload->>'action'='mode' then
  requested:=payload->>'mode';
  if not pharmacy_has_role(requested) then raise exception 'Modalità non autorizzata.';end if;
  update pharmacy_profiles set preferred_mode=requested where id=auth.uid();
  return jsonb_build_object('ok',true,'mode',requested);
 elsif payload->>'action'='roles' then
  if not pharmacy_admin() then raise exception 'Accesso riservato ai coordinatori.';end if;
  perform 1 from pharmacy_settings where id=1 for update;
  target:=(payload->>'id')::uuid;rs:=payload->'roles';
  if jsonb_typeof(rs) is distinct from 'array' then raise exception 'Ruoli non validi.';end if;
  if jsonb_array_length(rs) not between 1 and 2 or exists(select 1 from jsonb_array_elements_text(rs) r where r not in('coordinator','operator'))
   or (select count(distinct value) from jsonb_array_elements_text(rs))<>jsonb_array_length(rs) then raise exception 'Ruoli non validi.';end if;
  if not exists(select 1 from pharmacy_profiles where id=target) then raise exception 'Profilo non trovato.';end if;
  select jsonb_agg(role order by role) into old_roles from user_roles where user_id=target;
  insert into user_roles(user_id,role) select target,value from jsonb_array_elements_text(rs) on conflict do nothing;
  delete from user_roles where user_id=target and not (rs ? role);
  update pharmacy_profiles set preferred_mode=null where id=target and preferred_mode is not null and not (rs ? preferred_mode);
  insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),'roles_changed',target::text,jsonb_build_object('before',old_roles,'after',rs));
  return jsonb_build_object('ok',true);
 elsif payload->>'action'='self_preparation' then
  if not pharmacy_admin() then raise exception 'Accesso riservato ai coordinatori.';end if;
  reason:=trim(coalesce(payload->>'reason',''));
  if jsonb_typeof(payload->'enabled') is distinct from 'boolean' or length(reason) not between 3 and 500 then raise exception 'Indica la scelta e il motivo della modifica.';end if;
  select allow_coordinator_self_preparation into setting from pharmacy_settings where id=1 for update;
  update pharmacy_settings set allow_coordinator_self_preparation=(payload->>'enabled')::boolean where id=1;
  insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),'self_preparation_policy','1',jsonb_build_object('before',setting,'after',(payload->>'enabled')::boolean,'reason',reason));
  return jsonb_build_object('ok',true);
 end if;
 if payload->>'action'='order' and not pharmacy_has_role('operator') then raise exception 'Ruolo operatore richiesto.';end if;
 return pharmacy_action_before_dual(payload);
end;$$;
revoke all on function public.pharmacy_action(jsonb) from public,anon;
grant execute on function public.pharmacy_action(jsonb) to authenticated;

alter function public.pharmacy_data() rename to pharmacy_data_before_dual;
revoke all on function public.pharmacy_data_before_dual() from public,anon,authenticated;
create function public.pharmacy_data() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb;roles jsonb;mode text;
begin
 r:=pharmacy_data_before_dual();
 select coalesce(jsonb_agg(role order by role),'[]') into roles from user_roles where user_id=auth.uid();
 select preferred_mode into mode from pharmacy_profiles where id=auth.uid();
 if mode is null or not (roles ? mode) then mode:=case when roles ? 'coordinator' then 'coordinator' else 'operator' end;end if;
 if r->'user' is not null and r->'user'<>'null'::jsonb then r:=jsonb_set(r,'{user}',(r->'user')||jsonb_build_object('roles',roles,'mode',mode));end if;
 if pharmacy_admin() then
  r:=r||jsonb_build_object('settings',jsonb_build_object('allow_coordinator_self_preparation',(select allow_coordinator_self_preparation from pharmacy_settings where id=1)),
   'users',(select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('roles',(select coalesce(jsonb_agg(role order by role),'[]') from user_roles where user_id=p.id)) order by p.last,p.first),'[]') from pharmacy_profiles p));
 end if;
 return r;
end;$$;
create function public.pharmacy_data_for_mode(wanted text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb;mode text;ps jsonb;os jsonb;
begin
 r:=pharmacy_data();
 if not pharmacy_password_ok() then return r;end if;
 mode:=coalesce(wanted,r->'user'->>'mode');
 if not pharmacy_has_role(mode) then raise exception 'Modalità non autorizzata.';end if;
 r:=jsonb_set(r,'{user,mode}',to_jsonb(mode));
 if mode='operator' then
  select coalesce(jsonb_agg(item-'stock'-'minimum'-'configured'-'version'-'brand'-'monthly_limit'),'[]') into ps from jsonb_array_elements(r->'products') item;
  select coalesce(jsonb_agg(to_jsonb(o) order by o.created desc),'[]') into os from (select * from pharmacy_orders where user_id=auth.uid() order by created desc limit 500)o;
  r:=jsonb_build_object('user',r->'user','products',ps,'orders',os,'updated',r->'updated');
 end if;return r;
end;$$;
revoke all on function public.pharmacy_data(),public.pharmacy_data_for_mode(text) from public,anon;
grant execute on function public.pharmacy_data(),public.pharmacy_data_for_mode(text) to authenticated;

create function public.pharmacy_annual_report(report_year integer) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if not pharmacy_admin() then raise exception 'Report riservato ai coordinatori.';end if;
 if report_year not between 2000 and 2100 then raise exception 'Anno non valido.';end if;
 select jsonb_build_object('year',report_year,'operators',coalesce(jsonb_agg(to_jsonb(t) order by t.operator),'[]')) into result from (
  select o.user_id,o.operator,count(*)::integer orders,count(*) filter(where o.personal_coordinator)::integer personal_orders,
   count(*) filter(where o.reserved and o.status in('In preparazione','Pronto in farmacia','Consegnato'))::integer prepared_orders,
   coalesce(sum((select sum((i->>'qty')::integer) from jsonb_array_elements(o.items::jsonb)i)) filter(where o.reserved and o.status in('In preparazione','Pronto in farmacia','Consegnato')),0) prepared_quantity
  from pharmacy_orders o where o.created>=make_timestamptz(report_year,1,1,0,0,0,'Europe/Rome') and o.created<make_timestamptz(report_year+1,1,1,0,0,0,'Europe/Rome') group by o.user_id,o.operator
 )t;return result;
end;$$;
revoke all on function public.pharmacy_annual_report(integer) from public,anon;
grant execute on function public.pharmacy_annual_report(integer) to authenticated;

-- Account creation still uses one Auth user and the service-role-only entry point.
alter function public.pharmacy_manage_account(uuid,uuid,text,jsonb) rename to pharmacy_manage_account_before_dual;
revoke all on function public.pharmacy_manage_account_before_dual(uuid,uuid,text,jsonb) from public,anon,authenticated,service_role;
create function public.pharmacy_manage_account(actor_id uuid,target_id uuid,operation text,details jsonb default '{}'::jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare rs jsonb;
begin
 if operation='create' and details ? 'roles' then
  rs:=details->'roles';
  if jsonb_typeof(rs) is distinct from 'array' then raise exception 'Ruoli non validi.';end if;
  if jsonb_array_length(rs) not between 1 and 2 or exists(select 1 from jsonb_array_elements_text(rs) r where r not in('coordinator','operator')) or not (rs ? (details->>'role')) or (select count(distinct value) from jsonb_array_elements_text(rs))<>jsonb_array_length(rs) then raise exception 'Ruoli non validi.';end if;
 end if;
 perform pharmacy_manage_account_before_dual(actor_id,target_id,operation,details);
 if rs is not null then
  insert into user_roles(user_id,role) select target_id,value from jsonb_array_elements_text(rs) on conflict do nothing;
  delete from user_roles where user_id=target_id and not (rs ? role);
  insert into pharmacy_audit(actor,action,entity,detail) values(actor_id,'account_roles_created',target_id::text,jsonb_build_object('roles',rs));
 end if;
end;$$;
revoke all on function public.pharmacy_manage_account(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.pharmacy_manage_account(uuid,uuid,text,jsonb) to service_role;

create or replace function public.pharmacy_order_stock() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare line jsonb;p pharmacy_products;previous integer;used bigint;pending boolean:=false;why text:='';remaining integer;taken integer;lot pharmacy_lots;self_allowed boolean;today date:=(now() at time zone 'Europe/Rome')::date;
begin
 if TG_OP='INSERT' then
  if not pharmacy_has_role('operator') then raise exception 'Ruolo operatore richiesto.';end if;
  NEW.personal_coordinator:=pharmacy_admin_role();NEW.prepared_by:=null;NEW.prepared_at:=null;
 elsif OLD.personal_coordinator then
  NEW.personal_coordinator:=OLD.personal_coordinator;
  if (NEW.approval='approved' and OLD.approval='pending') or (NEW.status is distinct from OLD.status and NEW.status in('In preparazione','Pronto in farmacia','Consegnato')) then
   if not pharmacy_admin() then raise exception 'Preparazione riservata ai coordinatori.';end if;
   select allow_coordinator_self_preparation into self_allowed from pharmacy_settings where id=1;
   if NEW.user_id=auth.uid() then
    if not self_allowed then raise exception 'Un altro coordinatore deve autorizzare e preparare il tuo ordine.';end if;
    insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),'coordinator_self_preparation',NEW.id,jsonb_build_object('status',NEW.status,'approval',NEW.approval));
   end if;
   if not OLD.reserved and NEW.status in('Pronto in farmacia','Consegnato') then raise exception 'Conferma prima la preparazione.';end if;
  end if;
 end if;
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
  if pending or NEW.personal_coordinator then return NEW;end if;
 elsif NEW.status='Annullato' and OLD.status!='Annullato' then
  if not OLD.reserved then return NEW;end if;
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
  for line in select value from jsonb_array_elements(NEW.items::jsonb) loop update pharmacy_products set stock=stock+(line->>'qty')::integer,version=version+1 where id=(line->>'id')::integer;end loop;
  update pharmacy_lots l set quantity=l.quantity+a.quantity from pharmacy_allocations a where a.order_id=NEW.id and a.lot_id=l.id;
  NEW.reserved:=false;return NEW;
 elsif OLD.personal_coordinator and not OLD.reserved and NEW.status='In preparazione' and OLD.status='Ricevuto' then
  if NEW.approval<>'approved' then raise exception 'Autorizza prima la richiesta.';end if;
  NEW.prepared_by:=auth.uid();NEW.prepared_at:=now();
  perform 1 from pharmacy_products where id in(select (value->>'id')::integer from jsonb_array_elements(NEW.items::jsonb)) order by id for update;
 elsif OLD.personal_coordinator and OLD.approval='pending' and NEW.approval='approved' then
  return NEW;
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
  if NEW.personal_coordinator and p.stock-coalesce((select sum(quantity) from pharmacy_lots where product_id=p.id and expires<today),0)-remaining<p.minimum then
   insert into pharmacy_audit(actor,action,entity,detail) values(auth.uid(),'reserve20_preparation_exception',NEW.id,jsonb_build_object('product',p.id,'quantity',remaining));
  end if;
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

