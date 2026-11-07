# Materiali sanitari

Versione Next.js e Supabase per Vercel, derivata da [Inventory Management](https://github.com/BoviliusMeidi/inventory-management) di Bovilius Meidi (MIT).

Configurazione, migrazione dei dati, verifiche e pubblicazione: [MIGRAZIONE.md](./MIGRAZIONE.md).

La schermata operatore permette solo l'ordine. Il coordinatore gestisce magazzino, bolle, ruoli e avvisi di ritiro. L'accesso email/password è indipendente da ChatGPT.

La documentazione originale è conservata in [UPSTREAM_README.md](./UPSTREAM_README.md). Le estensioni farmacia sono in `src/app/`, `src/lib/pharmacy/` e `supabase/migrations/`.

## Estensione C-DOM e collaudo

Le funzionalità di autorizzazione mensile, fornitori, lotti e servizio Docling sono descritte in [COLLAUDO_CDOM.md](COLLAUDO_CDOM.md), con istruzioni per gli ambienti separati e test riproducibili.
