# C-DOM: collaudo del gestionale

Ramo: `collaudo/cdom-2026-11`. Produzione e main invariati.

Architettura corrente: Next.js su Vercel, database/Auth/Storage su Supabase, PDF.js e Tesseract.js nel browser per i PDF scannerizzati multipagina. Nessun servizio Python o VPS necessario. Le istruzioni correnti sono in [COLLEGAMENTO_MANUALE.md](COLLEGAMENTO_MANUALE.md).

Sono mantenuti dashboard separate, autorizzazioni mensili nel database, fornitori commerciali e codici, lotti e scadenze, FEFO, bolle private, audit, notifiche e PDF ordini orizzontali. L'OCR propone dati correggibili; il carico è atomico e avviene esclusivamente dopo conferma del coordinatore. Deduplicazione per hash e per fornitore/numero/data. Compilazione senza OCR disponibile. Lotto e scadenza sono facoltativi se assenti dal documento.

Verifiche locali:

```
npm ci
npm test
npm run test:ocr
npm run typecheck
npm run lint
npm run build
npm run prepare:collaudo -- <cartella-output>
```

La workflow GitHub aggiunge il collaudo PostgreSQL 17 con connessioni simultanee, oltre a OCR reale su PDF sintetico multipagina senza livello testuale. I test non usano dati sanitari reali. Il pacchetto SQL manuale viene eseguito su PostgreSQL embedded e le fixture richiedono consenso esplicito nel solo database test.

Non sono stati predisposti servizi cloud né verificata la disponibilità del dominio desiderato. Account reali e invio email restano da collaudare dopo il collegamento manuale di Supabase e Vercel. Non eseguire deploy in questa fase; `git.deploymentEnabled=false` mantiene disabilitati i deploy Git automatici.
