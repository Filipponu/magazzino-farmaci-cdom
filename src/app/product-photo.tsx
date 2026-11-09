'use client';
import {useState} from 'react';
import {Package} from 'lucide-react';
import {productImage} from '@/lib/pharmacy/product-images';

export default function ProductPhoto({name}:{name:string}) {
  const photo=productImage(name);
  const [failed,setFailed]=useState<string|null>(null);
  if (!photo || failed===photo.src) return <span className="op-product-icon" aria-hidden="true"><Package size={23}/></span>;
  return <figure className="op-photo">
    {/* External sources are loaded lazily and receive no page referrer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={photo.src} alt={photo.caption?'Foto illustrativa della linea del prodotto':'Foto illustrativa: '+name} width={160} height={120} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(photo.src)}/>
    <figcaption>{photo.caption||'Immagine illustrativa'}</figcaption>
  </figure>;
}
