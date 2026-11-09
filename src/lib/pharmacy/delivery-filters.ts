export function deliveryFilters(params:URLSearchParams){
 const number=(key:string,fallback:number,max:number)=>{const v=params.get(key);if(v===null)return fallback;if(!/^\d+$/.test(v)||Number(v)<1||Number(v)>max)throw new Error('Paginazione non valida.');return Number(v);};
 const result:Record<string,string|number>={page:number('page',1,1000000),size:number('size',25,100)};
 for(const key of ['supplier','number','q']){const v=(params.get(key)||'').trim();if(v.length>100)throw new Error('Filtro troppo lungo.');result[key]=v;}
 for(const key of ['date','from','to']){const v=params.get(key)||'';if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v))throw new Error('Data non valida.');result[key]=v;}
 if(result.from&&result.to&&result.from>result.to)throw new Error('Intervallo date non valido.');
 const id=params.get('record');if(id){if(!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))throw new Error('Documento non valido.');result.id=id;}
 return result;
}
