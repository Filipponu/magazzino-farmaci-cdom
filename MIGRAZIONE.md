# Materiali sanitari — migrazione Vercel

Base: https://github.com/BoviliusMeidi/inventory-management
Commit upstream: e392ecdf2436c987540e499653674ffd4bbfb522
Licenza MIT conservata nel file LICENSE. L'app deriva dal progetto Next.js/Supabase, riutilizza autenticazione, client Supabase e componenti dei moduli account. Il flusso di magazzino personale è sostituito dal modulo condiviso farmacia. Le vecchie pagine commerciali della base non sono esposte dalla navigazione/proxy.

## Funzioni
- Operatore: solo compilazione e invio ordini, senza giacenze o soglie. Avviso nell'app quando il materiale è pronto in farmacia.
- Coordinatore: ordini, PDF A4 orizzontale, giacenze e soglie, ruoli e autorizzazione degli account, bolle foto/PDF con lettura locale nel browser e conferma prima del carico.
- Nessuna scadenza mensile degli ordini.
- Database PostgreSQL condiviso con controlli transazionali, blocco sotto soglia, richieste idempotenti e annullamento con ripristino.
- Allegati privati su Supabase Storage. Caricamento diretto fino a 12 MB; lettura fino a 20 pagine.

## Attivazione
1. Crea un progetto Supabase dedicato e applica, nell'ordine, i file in `supabase/migrations/`. Non eseguire lo schema commerciale upstream `schema.sql`: il modulo farmacia usa tabelle dedicate `pharmacy_*`.
2. Configura il coordinatore principale nel SQL Editor con:
   `update public.pharmacy_settings set owner_email='EMAIL_DEL_COORDINATORE' where id=1;`
   La copia privata della migrazione conserva anche il profilo precedente da riassociare al primo accesso con la stessa email verificata.
3. In Supabase Auth abilita Email con conferma dell'indirizzo. Configura Site URL e Redirect URL su `https://TUO-SITO.vercel.app/auth/callback` (anche `?next=/update-password` per il recupero).
4. Imposta in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.
5. Importa il repository in Vercel come Next.js; usa `npm ci` e `npm run build`.
6. Il coordinatore registra il nuovo accesso con la propria email e password scelta personalmente, conferma l'email e completa il profilo. Gli altri profili rimangono in attesa di abilitazione da parte del coordinatore.

Non servono chiavi service-role nel browser né nel progetto. Le operazioni SQL sono funzioni RPC autorizzate con l'identità dell'utente. Non assegnare permessi di lettura diretta alle tabelle `pharmacy_*`.

## Verifiche
`npm run typecheck`
`npm test`
`npm run build`

I test eseguono PostgreSQL tramite PGlite: autorizzazione dei profili, privacy delle giacenze, minimo di magazzino, ordine idempotente, annullamento, avviso pronto, carico bolle, duplicati e rifiuto di accesso diretto alle tabelle. La connessione effettiva Supabase Auth/Storage richiede il progetto cloud configurato.

## Dati
Al momento dell'esportazione erano presenti 135 materiali, un profilo, zero ordini e zero bolle. Lo stato Sites non è modificato dalla preparazione della migrazione. Prima del passaggio definitivo ripetere l'esportazione per includere eventuali attività successive. Gli accessi ChatGPT non forniscono password trasferibili: ogni utente imposta il proprio accesso Supabase.

## Sviluppo e aggiornamenti
`npm install`
`npm run dev`

Usare un repository GitHub proprio, conservare la licenza MIT e collegarlo al progetto Vercel. Non spingere modifiche al repository dell'autore originale. Non inserire `.env.local`, credenziali, password o backup personali nel repository. Testare le migrazioni dati in un ambiente separato prima degli aggiornamenti di produzione.
