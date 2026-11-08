'use client';

import {useState} from 'react';
import {ArrowUpRight, Check, Minus, Plus, Search, ShoppingBag, X} from 'lucide-react';
import ProductPhoto from './product-photo';

type Product = {id:number; name:string; unit:string; pack:string; category?:string; stock:number; minimum:number; configured:number; orderLimit?:number};
type Props = {
  products:Product[];
  cart:Record<number,number>;
  busy:boolean;
  onQuantity:(id:number,quantity:number)=>void;
  onReview:()=>void;
};
const limit = (product:Product) => Math.max(0, product.orderLimit ?? (product.configured ? product.stock-product.minimum : 0));

export default function OperatorCatalog({products,cart,busy,onQuantity,onReview}:Props) {
  const [search,setSearch] = useState('');
  const [category,setCategory] = useState('');
  const [availableOnly,setAvailableOnly] = useState(false);
  const categories = Array.from(new Set(products.map(p=>p.category).filter((value):value is string=>Boolean(value)))).sort();
  const shown = products.filter(p=>p.name.toLocaleLowerCase('it').includes(search.toLocaleLowerCase('it')) && (!category || p.category===category) && (!availableOnly || limit(p)>0));
  const selected = products.filter(p=>(cart[p.id]||0)>0);
  const invalid = selected.some(p=>!Number.isInteger(cart[p.id]) || cart[p.id]>limit(p));
  const quantity = selected.reduce((total,p)=>total+cart[p.id],0);
  function change(product:Product,value:number) {
    if (!Number.isFinite(value)) return;
    onQuantity(product.id,Math.min(limit(product),Math.max(0,Math.trunc(value))));
  }
  return <section className="operator-catalog" aria-label="Catalogo e ordine">
    <div className="op-intro"><div className="op-intro-icon"><ShoppingBag size={26}/></div><div><span className="op-kicker">IL TUO ORDINE, UN PASSO ALLA VOLTA</span><h2>Scegli il materiale che ti serve</h2><p>Aggiungi le quantità, controlla il riepilogo e invia la richiesta.</p></div><span className="op-step"><b>1</b> Scegli <span>→</span><b>2</b> Rivedi <span>→</span><b>3</b> Invia</span></div>
    <div className="op-layout"><div className="op-results">
      <div className="op-filters">
        <label className="op-search"><Search size={20}/><span className="op-sr-only">Cerca materiale</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca garze, guanti, materiali…"/></label>
        <label className="op-category">Categoria<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Tutte le categorie</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
        <label className="op-available"><input type="checkbox" checked={availableOnly} onChange={e=>setAvailableOnly(e.target.checked)}/>Solo ordinabili</label>
      </div>
      <div className="op-result-count" role="status">{shown.length} {shown.length===1?'materiale':'materiali'}<span>Quantità espresse nell’unità indicata</span></div>
      <div className="op-product-grid">{shown.map(product=>{
        const max=limit(product), value=cart[product.id]||0;
        const prescription=/\bsu prescrizione(?: specialistica)?\b/i.test(product.name);
        const displayName=product.name.replace(/[,\s]*\bsu prescrizione(?: specialistica)?\b/ig,'').trim();
        return <article key={product.id} className={'op-product'+(value>0?' is-selected':'')+(max===0?' is-unavailable':'')}>
          <div className="op-product-top"><ProductPhoto name={product.name}/><span className={'op-availability '+(max>0?'can-order':'cannot-order')}>{max>0?<Check size={13}/>:null}{max>0?'Ordinabile':'Non disponibile'}</span></div>
          <span className="op-product-category">{product.category||'Materiale sanitario'}</span><h3>{displayName}</h3>{prescription&&<span className="op-prescription">Su prescrizione specialistica</span>}<p className="op-pack">{product.pack||'Unità singola'}</p>
          <div className="op-product-bottom"><span className="op-unit">Quantità in <strong>{product.unit}</strong></span>{max>0?<div className="op-stepper"><button type="button" disabled={busy||value<=0} aria-label={'Riduci quantità '+product.name} onClick={()=>change(product,value-1)}><Minus size={17}/></button><input type="number" inputMode="numeric" min={0} max={max} step={1} disabled={busy} aria-label={'Quantità '+product.name} value={value||''} placeholder="0" onChange={e=>change(product,e.target.valueAsNumber||0)}/><button type="button" disabled={busy||value>=max} aria-label={'Aumenta quantità '+product.name} onClick={()=>change(product,value+1)}><Plus size={17}/></button></div>:<span className="op-unavailable-note">Al momento non ordinabile</span>}</div>
        </article>;
      })}</div>
      {shown.length===0&&<div className="op-empty"><Search size={30}/><h3>{products.length?'Nessun materiale trovato':'Catalogo in preparazione'}</h3><p>{products.length?'Prova un altro nome o modifica i filtri.':'Il coordinatore deve ancora predisporre i materiali.'}</p>{products.length>0&&<button className="secondary" onClick={()=>{setSearch('');setCategory('');setAvailableOnly(false);}}>Azzera filtri</button>}</div>}
    </div>
    <aside className="op-cart" aria-label="Riepilogo ordine"><div className="op-cart-title"><ShoppingBag size={22}/><h2>La tua richiesta</h2><span>{selected.length}</span></div>
      {selected.length===0?<div className="op-cart-empty"><span><Plus size={24}/></span><h3>Inizia dal catalogo</h3><p>Premi + su un materiale per aggiungerlo alla richiesta.</p></div>:<ul className="op-cart-list">{selected.map(p=><li key={p.id}><div><strong>{p.name}</strong><small>{cart[p.id]} {p.unit}</small></div><button aria-label={'Rimuovi '+p.name} disabled={busy} onClick={()=>onQuantity(p.id,0)}><X size={17}/></button></li>)}</ul>}
      <div className="op-cart-totals" aria-live="polite"><span>Materiali selezionati</span><strong>{selected.length}</strong><span>Unità richieste</span><strong>{quantity}</strong></div>
      {invalid&&<p className="op-cart-warning" role="alert">La disponibilità è cambiata. Aggiorna le quantità selezionate prima di continuare.</p>}
      <button className="primary op-review" disabled={!selected.length||busy||invalid} onClick={onReview}>Rivedi ordine <ArrowUpRight size={18}/></button><p className="op-cart-note">Potrai controllare tutto e aggiungere una nota prima dell’invio.</p>
    </aside></div>
    <div className="op-mobile-review"><div aria-live="polite"><strong>{selected.length} {selected.length===1?'materiale':'materiali'}</strong><small>{quantity} unità nella richiesta</small></div><button className="primary" disabled={!selected.length||busy||invalid} onClick={onReview}>Rivedi ordine <ArrowUpRight size={17}/></button></div>
  </section>;
}
