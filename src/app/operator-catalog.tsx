'use client';
import {useState} from 'react';
import {ArrowUpRight, Check, Minus, Plus, Search, ShoppingBag} from 'lucide-react';
import ProductPhoto from './product-photo';

type Product={id:number;name:string;unit:string;pack:string;category?:string;stock:number;minimum:number;configured:number;orderLimit?:number;requestLimit?:number};
type Props={products:Product[];cart:Record<number,number>;busy:boolean;onQuantity:(id:number,quantity:number)=>void;onReview:()=>void};
const limit=(p:Product)=>Math.max(0,p.requestLimit??p.orderLimit??(p.configured?p.stock-p.minimum:0));
export default function OperatorCatalog({products,cart,busy,onQuantity,onReview}:Props){
 const [search,setSearch]=useState(''),[category,setCategory]=useState(''),[availableOnly,setAvailableOnly]=useState(false);
 const categories=Array.from(new Set(products.map(p=>p.category).filter((c):c is string=>Boolean(c)))).sort();
 const shown=products.filter(p=>(p.name+' MAT-'+String(p.id).padStart(3,'0')).toLocaleLowerCase('it').includes(search.toLocaleLowerCase('it'))&&(!category||p.category===category)&&(!availableOnly||limit(p)>0));
 const selected=products.filter(p=>(cart[p.id]||0)>0),quantity=selected.reduce((n,p)=>n+cart[p.id],0);
 const invalid=selected.some(p=>!Number.isInteger(cart[p.id])||cart[p.id]>limit(p));
 function change(p:Product,n:number){if(Number.isFinite(n))onQuantity(p.id,Math.min(limit(p),Math.max(0,Math.trunc(n))));}
 return <section className="operator-catalog op-list-catalog" aria-label="Catalogo e ordine">
  <div className="op-filters">
   <label className="op-search"><Search size={20}/><span className="op-sr-only">Cerca prodotto o codice</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca prodotto, codice o descrizione…"/></label>
   <label className="op-category"><span className="op-sr-only">Categoria</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Tutte le categorie</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
   <label className="op-available"><input type="checkbox" checked={availableOnly} onChange={e=>setAvailableOnly(e.target.checked)}/>Solo ordinabili</label>
   <p className="op-reserve-note">La riserva è il 20% della giacenza. Le richieste oltre la disponibilità ordinaria passano al Coordinatore.</p><span className="op-list-count" role="status">{shown.length} articoli</span>
  </div>
  <div className="panel op-catalog-table"><table><thead><tr><th>Articolo</th><th>Categoria</th><th>Confezione / unità</th><th>Disponibilità</th><th>Max richiedibile</th><th>Aggiungi</th></tr></thead><tbody>{shown.map(p=>{
   const max=limit(p),value=cart[p.id]||0,needsApproval=p.orderLimit!==undefined&&value>p.orderLimit,prescription=/\bsu prescrizione(?: specialistica)?\b/i.test(p.name),name=p.name.replace(/[,\s]*\bsu prescrizione(?: specialistica)?\b/ig,'').trim();
   return <tr key={p.id} className={value>0?'is-selected':''}>
    <td className="op-article-cell"><div className="op-article"><ProductPhoto name={p.name}/><div><strong>{name}</strong><small>Cod. MAT-{String(p.id).padStart(3,'0')}</small>{prescription&&<span className="op-prescription">Su prescrizione specialistica</span>}</div></div></td>
    <td data-label="Categoria"><span className="op-category-badge">{p.category||'Materiale sanitario'}</span></td>
    <td data-label="Confezione / unità">{p.pack||'Unità singola'}<small>Richiesta in {p.unit}</small></td>
    <td data-label="Disponibilità"><span className={'op-availability '+(max>0?'can-order':'cannot-order')}>{max>0&&<Check size={13}/>} {max>0?'Ordinabile':'Non disponibile'}</span></td>
    <td data-label="Max richiedibile"><strong>{max}</strong><small>{p.unit}</small>{p.orderLimit!==undefined&&<small>Fino a {p.orderLimit} senza autorizzazione</small>}</td>
    <td data-label="Aggiungi">{needsApproval&&<span className="op-prescription">Richiede autorizzazione</span>}<div className="op-stepper"><button type="button" disabled={busy||value<=0} aria-label={'Riduci quantità '+p.name} onClick={()=>change(p,value-1)}><Minus size={17}/></button><input type="number" inputMode="numeric" min={0} max={max} step={1} disabled={busy||max===0} aria-label={'Quantità '+p.name} value={value||''} placeholder="0" onChange={e=>change(p,e.target.valueAsNumber||0)}/><button type="button" disabled={busy||value>=max} aria-label={'Aumenta quantità '+p.name} onClick={()=>change(p,value+1)}><Plus size={17}/></button></div></td>
   </tr>;
  })}</tbody></table>{shown.length===0&&<div className="op-empty"><Search size={28}/><h3>{products.length?'Nessun articolo trovato':'Catalogo in preparazione'}</h3><p>{products.length?'Modifica la ricerca o i filtri.':'Il coordinatore deve predisporre i materiali.'}</p>{products.length>0&&<button className="secondary" onClick={()=>{setSearch('');setCategory('');setAvailableOnly(false);}}>Azzera filtri</button>}</div>}</div>
  <div className="op-list-checkout"><div aria-live="polite"><ShoppingBag size={22}/><span><strong>{selected.length} materiali selezionati</strong><small>{quantity} unità nella richiesta</small></span></div><button className="primary" disabled={!selected.length||busy||invalid} onClick={onReview}>Anteprima ordine <ArrowUpRight size={18}/></button>{invalid&&<p role="alert">La disponibilità è cambiata: aggiorna le quantità selezionate.</p>}</div>
 </section>;
}
