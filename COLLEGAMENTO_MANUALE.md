# Collegamento manuale del collaudo C-DOM

Stato: solo codice e configurazione locale. Nessun progetto cloud creato, servizio collegato, dominio prenotato, deploy eseguito o intervento sulla VPS. Questa procedura sostituisce le precedenti richieste di collegamento automatico.

## Gestione utenti aggiornata

La gestione utenti è ora manuale e SMTP resta in standby. Per account, primo coordinatore e ripristino senza email seguire `GESTIONE_UTENTI_MANUALE.md`; questa procedura sostituisce le indicazioni di autoregistrazione e recupero email riportate più sotto. Sul database test esistente applicare soltanto la nuova migrazione 202611080001_manual_users.sql.

## 1. Sorgenti da utilizzare

Repository esistente: `Filipponu/magazzino-farmaci-cdom`. Utilizzare il ramo `collaudo/cdom-2026-11`, che contiene il gestionale aggiornato; `main` non è stato modificato. Non creare un altro repository.

`npm run prepare:collaudo -- <cartella>` genera offline lo schema SQL completo, le fixture opzionali, il modello delle variabili e questa guida. Il comando non esegue lo schema e non contatta servizi.

## 2. Supabase — operazioni manuali

1. Nel proprio account Supabase creare un progetto **separato**, nome `magazzino-farmaci-cdom-test`, preferibilmente in una regione europea. Verificare piano e condizioni prima di confermare. Scegliere personalmente la password del database nell'interfaccia riservata.
2. Nel SQL Editor di quel progetto nuovo e vuoto eseguire **una sola volta** `01-schema-supabase-test.sql` generato dal comando precedente. Contiene tutte le migrazioni in ordine, racchiuse in una transazione. Non eseguirlo su una produzione o su un database dove quelle migrazioni sono già presenti. Un errore annulla l'intero script: risolverlo prima di riprovare.
3. In alternativa usare Supabase CLI e `supabase db push` collegati esclusivamente al progetto test, applicando i file originali di `supabase/migrations`. Scegliere SQL Editor **oppure** CLI: l'esecuzione manuale non registra automaticamente lo storico della CLI, quindi non mescolare i due metodi senza riconciliare le migrazioni.
4. Verificare nelle tabelle le entità `pharmacy_*`, RLS attiva, e in Storage il bucket `bolle`, che deve restare **privato**. Le scritture applicative avvengono tramite RPC con controlli di ruolo, non con accesso diretto alle tabelle.
5. In Authentication abilitare email/password e **conferma email**, password di almeno 12 caratteri e SMTP per i messaggi di conferma/recupero. Inserire le credenziali SMTP solo nella configurazione riservata di Supabase. Il servizio email predefinito può avere restrizioni sui destinatari: verificarle prima del test con l'operatore.
6. Dopo aver confermato il dominio Vercel effettivo, configurare Site URL con quell'URL e aggiungere i redirect esatti:
   - `https://magazzino-farmaci-cdom-test.vercel.app/auth/callback`
   - `https://magazzino-farmaci-cdom-test.vercel.app/auth/callback?next=/update-password`
   Sostituire il dominio se quello richiesto non è disponibile. Per eventuali preview aggiungere solo i relativi URL di callback necessari, senza wildcard generiche.
7. Conservare URL del progetto e chiave pubblica `anon`/publishable per l'inserimento riservato su Vercel. **Mai** mettere una chiave `service_role`/secret in variabili `NEXT_PUBLIC_*`.

Account coordinatore: l'email configurata nel database è `monica.silini@finisterre.medicair.it`. Non viene creato alcun account automaticamente. Dopo il primo deploy manuale Monica dovrà registrarsi, verificare l'email, compilare nome/cognome/professione e impostare una nuova password al primo accesso. Un operatore deve registrarsi con una seconda email controllata dal collaudatore, professione **Infermiere**, e attendere l'abilitazione da parte del coordinatore. Non inserire identità di pazienti.

## 3. Vercel — preparazione e futuro primo deploy manuale

Nome richiesto: **magazzino-farmaci-cdom-test**. Dominio desiderato: **magazzino-farmaci-cdom-test.vercel.app**. È una richiesta: disponibilità e assegnazione devono essere confermate nel pannello al momento della creazione. Non risultano verificate o garantite da questi file.

Quando si deciderà di procedere manualmente:

1. Aprire Add New → Project e importare il repository esistente. Per selezionare il ramo aggiornato usare il riferimento Git `https://github.com/Filipponu/magazzino-farmaci-cdom/tree/collaudo/cdom-2026-11`; controllare nel riepilogo che il ramo sia quello di collaudo.
2. Impostare Project Name `magazzino-farmaci-cdom-test`, Root Directory alla radice, framework **Next.js**, Node.js **22.x**, Install Command `npm ci`, Build Command `npm run build`. Lasciare Output Directory gestita da Next.js: non impostare un'esportazione statica.
3. Prima del primo deploy inserire nelle impostazioni riservate del **solo progetto test** le variabili della tabella sotto. Per il dominio stabile `.vercel.app` servono anche nell'ambiente che Vercel denomina **Production di questo progetto test**; questo non autorizza a cambiare la produzione del gestionale esistente. Configurarle anche per Preview se si useranno preview, sempre con lo stesso Supabase test o con un database test dedicato.
4. Il pulsante **Deploy avvia realmente la pubblicazione**. In questa fase fermarsi prima di quel pulsante. La preparazione del modulo non prenota il dominio né rende l'app online.
5. Soltanto quando pronti, l'utente potrà avviare manualmente il primo deploy. Verificare l'URL assegnato in Settings → Domains, poi riallineare `NEXT_PUBLIC_APP_URL` e i redirect Supabase all'URL effettivo. Se si cambiano variabili dopo il build occorre un nuovo deploy manuale.

| Variabile | Valore da configurare nel progetto test |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL HTTPS effettivamente assegnato, senza slash finale |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del nuovo Supabase test |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave pubblica anon/publishable di quel progetto |

`vercel.json` imposta `git.deploymentEnabled=false`: i push Git non devono generare deploy automatici. Non è un blocco dei deploy manuali: non premere Deploy e non eseguire comandi di pubblicazione finché non si intende avviarli. La workflow GitHub esegue test e build, senza pubblicare né applicare migrazioni cloud.

Controllo facoltativo offline: `npm run check:collaudo` verifica le variabili già presenti nell'ambiente del terminale, senza stamparne i valori e senza contattare servizi. Non prova la validità delle credenziali o la disponibilità del dominio. Nessuno deve copiare segreti in chat o in file versionati.

## 4. Dati sintetici e primo collaudo

Nel solo SQL Editor del progetto test, se si vogliono dati dimostrativi, eseguire nella **stessa transazione**:

```
BEGIN;
SET LOCAL cdom.allow_synthetic_seed='yes';
-- Incollare qui il contenuto di 02-fixture-sintetiche.sql.
COMMIT;
```

Le fixture non creano account, non azzerano giacenze e non sovrascrivono dati esistenti. Ripeterle non ripristina i saldi dopo un test. Contengono tre prodotti `TEST CDOM`, due fornitori fittizi, codici simili, un lotto valido e uno scaduto; non rappresentano farmaci da somministrare.

Sequenza suggerita, partendo dalle fixture appena inserite:

| Prova manuale | Risultato atteso |
|---|---|
| Registrazione e primo accesso coordinatore | Conferma email, profilo coordinatore e cambio password richiesto |
| Registrazione operatore Infermiere | Nessun ordine finché il coordinatore non abilita l'accesso |
| Area operatore | Catalogo senza giacenza/soglia minima; accesso al coordinamento negato |
| Fornitori | Garza TEST associata al fornitore A; farmaco sintetico al B, con codici distinti `TEST-010` e `TEST-O10` |
| Prima richiesta di 3 garze TEST | Autorizzazione automatica; giacenza totale da 100 a 97 |
| Seconda richiesta di 1 garza TEST | In attesa; giacenza resta 97; approvazione motivata la porta a 96 |
| Terza richiesta di 4 garze TEST | In attesa anche per limite mensile superato; rifiuto motivato lascia 96 |
| Materiale TEST a soglia | Non ordinabile, giacenza 10 e soglia 10 |
| Stato pronto | Coordinatore segnala pronto; operatore vede notifica e può scaricare il PDF orizzontale |
| Annullamento della prima richiesta | Ripristino di 3 pezzi e delle relative allocazioni, una sola volta |
| Bolla sintetica di carico di 10 garze | Upload privato; scegliere fornitore A, numero/data univoci, prodotto TEST, lotto e scadenza; nessun carico al salvataggio, +10 solo dopo conferma |
| Duplicato della stessa bolla | Nessun secondo carico |
| Lotti | Lotto scaduto in elenco, escluso dalle quantità prelevabili |
| Utente sospeso o ruolo errato | Operazioni riservate bloccate anche lato server/database |

Il file `bolla-sintetica-200dpi.pdf` della precedente consegna è un documento di prova OCR: nel collaudo manuale associare esplicitamente le sue righe ai prodotti TEST. La ricezione di materiale e il successivo ordine sono movimenti distinti; lo scarico avviene alla riserva autorizzata, non una seconda volta quando viene segnato Consegnato.

## 5. OCR nel browser

I PDF dello scanner, anche multipagina, vengono rasterizzati da PDF.js e letti con Tesseract.js nel browser del coordinatore. Worker, motore WASM e lingua italiana sono serviti dall'applicazione stessa: nessun endpoint OCR esterno, token OCR o VPS è necessario. Le pagine standard sono lette a 200 DPI; i formati molto grandi sono limitati a 12 milioni di pixel per pagina per contenere la memoria. Limiti: 12 MiB, 20 pagine, 80.000 caratteri e 300 righe proposte. Il tempo dipende dal computer e dalla qualità della scansione.

L'upload privato rimane su Supabase. Il testo riconosciuto viene salvato solo con i dati verificati della bolla. Il coordinatore può correggere fornitore, numero/data, codici, descrizioni, prodotti, quantità, lotti e scadenze. I fornitori sono proposti solo tra quelli configurati: un marchio non genera un fornitore. Le righe vengono abbinate usando codici del fornitore selezionato; i codici ambigui richiedono scelta manuale.

Disattivare «OCR nel browser dopo il caricamento» per compilare interamente a mano. Dopo aver corretto i dati premere Salva, controllare nuovamente l'originale e poi Conferma carico: il primo comando non cambia le giacenze. Lotto e scadenza si possono lasciare vuoti quando non presenti; non vengono inventati valori. Un lotto senza scadenza viene mantenuto distinto, senza classificarlo come scaduto.

La VPS `vmi2636562.contaboserver.net` non viene utilizzata né deve essere configurata. Non è stata contattata, ispezionata o modificata.

## Riferimenti ufficiali

- Importazione e selezione ramo: https://vercel.com/docs/git
- Blocco deploy Git: https://vercel.com/docs/project-configuration/git-configuration
- Variabili Vercel: https://vercel.com/docs/environment-variables/managing-environment-variables
- Redirect Supabase: https://supabase.com/docs/guides/auth/redirect-urls
- Configurazione Auth/SMTP: https://supabase.com/docs/guides/auth/general-configuration
