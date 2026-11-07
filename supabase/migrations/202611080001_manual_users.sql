-- Manual account provisioning. Never stores temporary passwords.
alter table public.pharmacy_profiles add column manual_account boolean not null default false;
create or replace function public.pharmacy_password_changed() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if NEW.encrypted_password is distinct from OLD.encrypted_password and length(coalesce(NEW.encrypted_password,''))>0 then
  update pharmacy_profiles set password_change_required=((NEW.raw_app_meta_data->>'cdom_reset_nonce') is distinct from (OLD.raw_app_meta_data->>'cdom_reset_nonce')) where id=NEW.id;
  insert into pharmacy_audit(actor,action,entity) values(NEW.id,'password_changed',NEW.id::text);
 end if;return NEW;
end;$$;
create or replace function public.pharmacy_password_ok() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from pharmacy_profiles p where p.id=auth.uid() and p.enabled and not p.password_change_required
 and (not p.manual_account or exists(select 1 from auth.sessions s where s.id::text=auth.jwt()->>'session_id' and s.user_id=p.id)));
$$;
-- Serializes all demotions/deactivations, including existing RPC calls.
create function public.pharmacy_protect_coordinators() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform 1 from pharmacy_settings where id=1 for update;
 if OLD.role='coordinator' and OLD.enabled and (NEW.role!='coordinator' or not NEW.enabled) and
 not exists(select 1 from pharmacy_profiles where id!=OLD.id and role='coordinator' and enabled) then
 raise exception 'Deve rimanere almeno un coordinatore attivo.';end if;return NEW;
end;$$;
create trigger pharmacy_protect_coordinators before update of role,enabled on public.pharmacy_profiles for each row execute function public.pharmacy_protect_coordinators();
-- Close self-service profile creation, retaining the existing access/role implementation.
alter function public.pharmacy_action(jsonb) rename to pharmacy_action_before_manual;
revoke all on function public.pharmacy_action_before_manual(jsonb) from public,anon,authenticated;
create function public.pharmacy_action(payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$begin
 if payload->>'action' in('role','access') then perform 1 from pharmacy_settings where id=1 for update;end if;
 if payload->>'action'='register' then raise exception 'Rivolgiti al coordinatore';end if;
 return pharmacy_action_before_manual(payload);
end;$$;
grant execute on function public.pharmacy_action(jsonb) to authenticated;
revoke all on function public.pharmacy_action(jsonb) from public,anon;
-- Service-role-only procedure. Actor identity comes from verified server session.
create function public.pharmacy_manage_account(actor_id uuid,target_id uuid,operation text,details jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare a pharmacy_profiles;t pharmacy_profiles;
begin
 perform 1 from pharmacy_settings where id=1 for update;
 select * into a from pharmacy_profiles where id=actor_id for update;
 if a.id is null or a.role!='coordinator' or not a.enabled or a.password_change_required then raise exception 'Accesso riservato ai coordinatori attivi.';end if;
 if target_id=actor_id then raise exception 'Non puoi ripristinare il tuo stesso account.';end if;
 if operation='create' then
  if details->>'role' not in('coordinator','operator') or details->>'profession' not in('Infermiere','OSS','Fisioterapista') or
  length(trim(coalesce(details->>'first',''))) not between 1 and 60 or length(trim(coalesce(details->>'last',''))) not between 1 and 60 then raise exception 'Dati non validi.';end if;
  insert into pharmacy_profiles(id,email,first,last,profession,role,enabled,password_change_required,manual_account)
  values(target_id,details->>'email',trim(details->>'first'),trim(details->>'last'),details->>'profession',details->>'role',true,true,true);
 elsif operation in('reset','reset_done') then
  select * into t from pharmacy_profiles where id=target_id for update;
  if t.id is null then raise exception 'Account non trovato.';end if;
  update pharmacy_profiles set password_change_required=true,manual_account=true where id=target_id;
  delete from auth.sessions where user_id=target_id;
  delete from auth.refresh_tokens where user_id=target_id::text;
 else raise exception 'Operazione non valida.';end if;
 insert into pharmacy_audit(actor,action,entity,detail) values(actor_id,'account_'||operation,target_id::text,jsonb_build_object('role',coalesce(details->>'role',t.role)));
end;$$;
revoke all on function public.pharmacy_manage_account(uuid,uuid,text,jsonb),public.pharmacy_protect_coordinators() from public,anon,authenticated;
grant execute on function public.pharmacy_manage_account(uuid,uuid,text,jsonb) to service_role;

-- Public signUp cannot set app_metadata; only the Auth admin API can provision accounts.
create function public.pharmacy_auth_provision_only() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if coalesce(NEW.raw_app_meta_data->>'cdom_managed','')!='true' then raise exception 'Rivolgiti al coordinatore';end if;return NEW;
end;$$;
create trigger pharmacy_auth_provision_only before insert on auth.users for each row execute function public.pharmacy_auth_provision_only();
revoke all on function public.pharmacy_auth_provision_only() from public,anon,authenticated;
create function public.pharmacy_live_session() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from pharmacy_profiles p where p.id=auth.uid() and p.enabled and
 (not p.manual_account or exists(select 1 from auth.sessions s where s.id::text=auth.jwt()->>'session_id' and s.user_id=p.id)));
$$;
revoke all on function public.pharmacy_live_session() from public,anon;
grant execute on function public.pharmacy_live_session() to authenticated;
create function public.pharmacy_bootstrap_coordinator(target_id uuid,first_name text,last_name text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare e text;begin
 perform 1 from pharmacy_settings where id=1 for update;
 if exists(select 1 from pharmacy_profiles where role='coordinator' and enabled) then raise exception 'Coordinatore già presente.';end if;
 select email into e from auth.users where id=target_id and raw_app_meta_data->>'cdom_managed'='true';
 if e is null or lower(e)!=(select lower(owner_email) from pharmacy_settings where id=1) or length(trim(first_name)) not between 1 and 60 or length(trim(last_name)) not between 1 and 60 then raise exception 'Dati bootstrap non validi.';end if;
 insert into pharmacy_profiles(id,email,first,last,profession,role,enabled,manual_account) values(target_id,e,trim(first_name),trim(last_name),'Infermiere','coordinator',true,true);
 insert into pharmacy_audit(actor,action,entity) values(target_id,'coordinator_bootstrap',target_id::text);
end;$$;
revoke all on function public.pharmacy_bootstrap_coordinator(uuid,text,text) from public,anon,authenticated;
grant execute on function public.pharmacy_bootstrap_coordinator(uuid,text,text) to service_role;
