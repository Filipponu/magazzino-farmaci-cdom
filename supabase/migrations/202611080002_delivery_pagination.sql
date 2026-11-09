-- Read-only archive pagination; existing upload, OCR and confirmation routines unchanged.
create index pharmacy_deliveries_archive_order on public.pharmacy_deliveries(date desc,created desc,id desc) where uploaded;
create function public.pharmacy_delivery_page(filters jsonb default '{}'::jsonb) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare p integer:=coalesce((filters->>'page')::integer,1);n integer:=coalesce((filters->>'size')::integer,25);
 total bigint;r jsonb;pages bigint;f text:=coalesce(filters->>'supplier','');num text:=coalesce(filters->>'number','');q text:=coalesce(filters->>'q','');
 exact_date text:=coalesce(filters->>'date','');lo text:=coalesce(filters->>'from','');hi text:=coalesce(filters->>'to','');v text;
begin
 if not pharmacy_admin() then raise exception 'Bolle riservate ai coordinatori.';end if;
 if p<1 or p>1000000 or n<1 or n>100 or length(f)>100 or length(num)>100 or length(q)>100 then raise exception 'Filtri non validi.';end if;
 foreach v in array array[exact_date,lo,hi] loop
  if v!='' then if v !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data non valida.';end if;perform v::date;end if;
 end loop;
 if lo!='' and hi!='' and lo>hi then raise exception 'Intervallo date non valido.';end if;
 select count(*) into total from pharmacy_deliveries d where uploaded
 and (filters->>'id' is null or d.id=(filters->>'id')::uuid)
 and position(lower(f) in lower(d.supplier))>0 and position(lower(num) in lower(d.number))>0
 and (q='' or position(lower(q) in lower(d.supplier||' '||d.number||' '||d.filename))>0)
 and (exact_date='' or d.date=exact_date) and (lo='' or d.date>=lo) and (hi='' or (d.date!='' and d.date<=hi));
 pages:=greatest(1,(total+n-1)/n);p:=least(p,pages)::integer;
 select coalesce(jsonb_agg(to_jsonb(d)||jsonb_build_object('supplier_id',m.supplier_id,'lot_review',m.lines,'ocr_job',to_jsonb(j))
 order by nullif(d.date,'') desc nulls last,d.created desc,d.id desc),'[]'::jsonb) into r
 from(select * from pharmacy_deliveries d where uploaded
 and (filters->>'id' is null or d.id=(filters->>'id')::uuid)
 and position(lower(f) in lower(d.supplier))>0 and position(lower(num) in lower(d.number))>0
 and (q='' or position(lower(q) in lower(d.supplier||' '||d.number||' '||d.filename))>0)
 and (exact_date='' or d.date=exact_date) and (lo='' or d.date>=lo) and (hi='' or (d.date!='' and d.date<=hi))
 order by nullif(d.date,'') desc nulls last,d.created desc,d.id desc limit n offset (p-1)*n)d
 left join pharmacy_delivery_lots m on m.delivery_id=d.id left join pharmacy_ocr j on j.delivery_id=d.id;
 return jsonb_build_object('deliveries',r,'total',total,'page',p,'pages',pages,'size',n);
end;$$;
revoke all on function public.pharmacy_delivery_page(jsonb) from public,anon;
grant execute on function public.pharmacy_delivery_page(jsonb) to authenticated;
