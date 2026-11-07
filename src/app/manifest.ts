import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
 return {name:'Gestionale Farmacia',short_name:'Gestionale Farmacia',lang:'it',start_url:'/',scope:'/',display:'standalone',background_color:'#ffffff',theme_color:'#142d4e',icons:[{src:'/favicon.svg',sizes:'any',type:'image/svg+xml'}]};
}
