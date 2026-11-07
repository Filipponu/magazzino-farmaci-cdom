# C-DOM: implementazione e collaudo

Ramo di lavoro: `collaudo/cdom-2026-11`. Nessun aggiornamento della produzione o di `main`.

## Funzioni implementate

- Due aree con navigazione separata, sidebar blu e pannelli chiari secondo il [riferimento grafico approvato](https://chatgpt.com/s/m_6aeee4b8ef948191b35e5e8c6583ef4a). Le colonne di giacenza e soglia minima sono escluse dai dati restituiti agli operatori.
- Panoramica, catalogo/categorie/marchio, fornitori commerciali configurabili e codici distinti per fornitore. B. Braun, Angelini e i fornitori commerciali di Prontosan/disinfettanti si configurano dopo averne verificato la ragione sociale: non vengono dedotti dal marchio.
- Limite mensile prodotto/per operatore. Prima richiesta entro limite automatica; successive o oltre limite in attesa. Motivo obbligatorio per autorizzazione/rifiuto. Giacenza riservata solo dopo autorizzazione, con nuovo controllo sotto lock.
- Mese determinato dal database in Europe/Rome, indipendente dalla data inviata dal browser. I conteggi del nuovo mese partono da zero senza eliminare lo storico. Anche una richiesta annullata/rifiutata rimane una richiesta già effettuata nel mese; il consumo escluso viene restituito.
- Lotti/scadenze, prelievo FEFO e restituzione delle esatte allocazioni annullate. Lotti scaduti esclusi dai prelievi. Il materiale precedente senza lotto è visibile come da censire; non vengono inventati lotti retroattivi.
- Bolle originali private, hash univoco, duplicati anche per fornitore/documento/data, righe distinte per lotto, conferma manuale e carico atomico. Gli articoli dello stesso prodotto sono aggregati solo per il totale del carico.
- Notifica interna «pronto in farmacia», storico e PDF A4 orizzontale già esistenti mantenuti.
- Registro operazioni e anomalie, autorizzazioni per ruolo e RPC protette. Nessun accesso diretto alle tabelle applicative con ruoli anon/authenticated.
- Supabase Auth esistente mantenuta; coordinatore principale `monica.silini@finisterre.medicair.it`. Dopo conferma email e registrazione del profilo è obbligatorio cambiare password. Solo l'aggiornamento effettivo dell'hash da parte di Supabase Auth sblocca l'account; nessun flag modificabile dal browser.

## Docling su VPS

`services/docling` contiene FastAPI, coda SQLite persistente, Dockerfile e Compose. Il servizio non riceve chiavi Supabase e non può fare carichi.

Flusso: upload privato → verifica hash/magic bytes → Next.js autenticato invia PDF al servizio → job con deduplicazione SHA-256 → Docling legge testo/tabelle a 200 DPI → proposte con codici esatti nel contesto del fornitore → coordinatore verifica originale e completa lotto/scadenza/quantità → salva → conferma carico.

Token Bearer server di almeno 32 caratteri; HTTPS obbligatorio tra Vercel e VPS. File massimo 12 MiB e 20 pagine, PDF cifrati/danneggiati rifiutati, coda massima 20 job, processo OCR separato con timeout 240 secondi, pulizia originali temporanei dopo elaborazione e risultati dopo 7 giorni. Retry degli errori dopo almeno 60 secondi. Il documento originale rimane in Storage privato.

Avvio sul VPS dalla cartella `services/docling`: impostare `DOCLING_API_TOKEN` tramite secret manager del server, quindi `docker compose up -d --build`. Il bind è solo `127.0.0.1:8000`: esporlo con reverse proxy HTTPS autenticato, senza pubblicare direttamente la porta. Predisporre i volumi per UID 10001, almeno 6 GB RAM e spazio per modelli/cache. Al primo avvio i modelli vengono scaricati dalle distribuzioni Docling/RapidOCR: completare il riscaldamento con il PDF sintetico prima del collaudo. Nessun documento viene inviato a un servizio di IA remoto.

## Ambienti e accesso

Usare un Supabase **di collaudo separato**. Non applicare queste migrazioni alla produzione senza autorizzazione e backup verificato. Applicare tutti i file di `supabase/migrations` in ordine, tramite Supabase CLI collegata al solo progetto di prova. Le due migrazioni del 7 novembre sono additive e mantengono gli ordini già riservati. Verificare i trigger su `auth.users` con il ruolo di migrazione Supabase e il bucket privato `bolle`.

Configurare le variabili **Preview** Vercel da `.env.example`: URL/anon key del Supabase di collaudo, URL pubblico della preview per i redirect Auth, URL HTTPS VPS e token Docling server. Non usare un service-role key nel browser. Aggiungere nell'allowlist Supabase l'URL esatto di callback della preview e del recupero password; email confirmation e SMTP devono essere attivi. La produzione resta su branch/variabili distinti.

Per attivare Monica: aprire `/signup`, usare l'email principale, scegliere personalmente la password, confermare il link email e compilare nome/cognome/professione. Il sistema assegna il ruolo coordinatore solo all'email configurata verificata da Supabase. Al primo accesso viene richiesto un nuovo aggiornamento della password. Non sono stati creati account reali né inviate email da questa implementazione. Gli altri operatori si registrano allo stesso modo e devono essere abilitati dal coordinatore.

## Verifiche riproducibili

```
npm ci --no-audit --no-fund
npm test
npm run typecheck
npm run lint
npm run build
python -m pip install -r services/docling/requirements-test.txt
python -m pytest services/docling/test_service.py -q
python services/docling/test_service.py
```

`npm test` applica tutte le migrazioni a PostgreSQL embedded PGlite e genera oltre 550 movimenti sintetici, oltre a richieste duplicate, limiti, ruoli, scadenze, lotti, annullamenti e accessi illeciti. Le identità `example.test` e gli hash password sono esclusivamente stub di test.

La workflow `.github/workflows/cdom-collaudo.yml` aggiunge PostgreSQL 17 con 20 connessioni simultanee e un job Docling su Linux. Il test distruttivo remoto accetta solo un database chiamato `cdom_synthetic_test` e `ALLOW_SYNTHETIC_DB=yes`; non collegarlo a database con dati reali. Non richiede credenziali di produzione. I test PGlite accodano le operazioni: non sostituiscono la verifica della concorrenza multi-sessione.

## Stato degli ambienti esterni

Build/typecheck, test PostgreSQL embedded, matching codici, PDF orizzontale di 11 pagine e test API OCR sono stati eseguiti localmente. È passato anche il flusso OCR reale autenticato con coda, processo separato e polling su PDF sintetico a 200 DPI; la verifica ha corretto l’esclusione predefinita delle intestazioni DDT dall’export Docling. Su GitHub Actions è passata la prova su PostgreSQL 17 con 20 connessioni simultanee, oltre a installazione, test, typecheck, lint e build Linux. Le schermate sono state controllate con una fixture grafica temporanea, rimossa prima del commit: questo non equivale a una prova Supabase Auth/Storage cloud.

Il collegamento Vercel al team restituisce ancora 403 dopo il tentativo di autorizzazione. Nel pannello Vercel il repository risulta suggerito per importazione, senza un progetto già collegato. Supabase di collaudo, SMTP e VPS non sono stati indicati/configurati. Non esiste pertanto ancora un URL di collaudo cloud funzionante. Gli esiti finali delle verifiche OCR e CI sono riportati nella consegna del ramo/PR.
