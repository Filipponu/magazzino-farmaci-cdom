import type {Metadata} from 'next';
import './globals.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Gestionale Farmacia',applicationName:'Gestionale Farmacia',appleWebApp:{title:'Gestionale Farmacia'},manifest:'/manifest.webmanifest',description:'Ordini di materiale sanitario, farmacia e giacenze.'};
export default function Layout({children}:{children:React.ReactNode}){if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)return <html lang="it"><body><main className="welcome"><div className="brand">Gestionale Farmacia</div><h1>Collegamento al database da completare</h1><p>La versione Vercel è stata preparata. Per usare ordini, account e bolle occorre collegare Supabase e applicare le migrazioni.</p><p>Il servizio attuale rimane disponibile fino al completamento della migrazione.</p></main></body></html>;return <html lang="it"><body>{children}</body></html>;}
