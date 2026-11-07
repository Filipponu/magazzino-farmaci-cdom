-- MANUAL / TEST ONLY. No auth.users, identities, passwords or actual supplier records.
-- In the SQL Editor of the dedicated TEST project, run in the same transaction:
-- BEGIN; SET LOCAL cdom.allow_synthetic_seed='yes'; [this file] COMMIT;
do $$begin
 if current_setting('cdom.allow_synthetic_seed',true) is distinct from 'yes' then
  raise exception 'Conferma manualmente il progetto di collaudo e abilita cdom.allow_synthetic_seed nella stessa transazione.';
 end if;
 if exists(select 1 from public.pharmacy_products where id in(990001,990002,990003) and name not like 'TEST CDOM%') then raise exception 'ID già utilizzati: nessun dato modificato.';end if;
 insert into public.pharmacy_suppliers(id,name,email) values
 ('99000000-0000-4000-8000-000000000001','TEST CDOM Fornitore A',''),
 ('99000000-0000-4000-8000-000000000002','TEST CDOM Fornitore B','') on conflict(id) do nothing;
 insert into public.pharmacy_products(id,name,pack,unit,stock,minimum,configured,monthly_limit,category,brand) values
 (990001,'TEST CDOM Garza sintetica','Confezione di prova','pezzi',100,10,1,5,'TEST Presidi','Marchio sintetico'),
 (990002,'TEST CDOM Materiale sintetico a soglia','Confezione di prova','pezzi',10,10,1,null,'TEST Presidi','Marchio sintetico'),
 (990003,'TEST CDOM Farmaco sintetico non clinico','SOLO TEST - non somministrare','pezzi',50,5,1,null,'TEST Farmaci','Marchio sintetico') on conflict(id) do nothing;
 insert into public.pharmacy_articles(supplier_id,product_id,code) values
 ('99000000-0000-4000-8000-000000000001',990001,'TEST-010'),
 ('99000000-0000-4000-8000-000000000002',990003,'TEST-O10') on conflict(supplier_id,code) do nothing;
 insert into public.pharmacy_lots(id,product_id,supplier_id,code,expires,quantity) values
 ('99000000-0000-4000-8000-000000000011',990001,'99000000-0000-4000-8000-000000000001','TEST-VALIDO','2099-12-31',90),
 ('99000000-0000-4000-8000-000000000012',990001,'99000000-0000-4000-8000-000000000001','TEST-SCADUTO','2000-01-01',10) on conflict(id) do nothing;
end;$$;
