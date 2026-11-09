# Coordinatore e Operatore con un unico account

La migrazione `202611090001_dual_roles.sql` aggiunge `user_roles` (chiave primaria composta `user_id, role`). Mantiene profili, qualifiche professionali, account Auth e ordini esistenti. I Coordinatori esistenti mantengono anche l’accesso alla vista Operatore; i nuovi account possono essere creati con uno o entrambi i ruoli. Il vecchio campo `pharmacy_profiles.role` rimane una proiezione per compatibilità con le procedure esistenti: i controlli amministrativi verificano `user_roles`.

Il selettore Modalità compare solo con entrambi i ruoli. Non effettua logout, non cambia i ruoli e salva `preferred_mode` nel profilo. La risposta per la vista Operatore contiene solo lo storico personale e non contiene utenti, lotti, audit o impostazioni. Il permesso reale di un utente con doppio ruolo rimane invariato. I componenti di coordinamento vengono importati dinamicamente e montati soltanto nella vista Coordinatore.

## Ordini personali

Un nuovo ordine creato da un utente con entrambi i ruoli è marcato dal database come `personal_coordinator`, indipendentemente dalla modalità grafica. Il richiedente è sempre `auth.uid()`. L’ordine segue gli stessi limiti e la riserva dinamica del 20%, ma non riserva/scarica giacenze alla richiesta o all’approvazione. Lo scarico atomico avviene passando da Ricevuto a In preparazione: vengono ricontrollati disponibilità, lotti non scaduti e autorizzazione del preparatore, e registrati `prepared_by` e `prepared_at`. Se il materiale nel frattempo non basta, la preparazione viene rifiutata senza scarichi parziali. Richieste personali ancora non preparate non garantiscono disponibilità: questa viene ricontrollata alla preparazione.

Le quantità degli ordini operatori ordinari e le riserve storiche mantengono il comportamento precedente. Gli annullamenti ripristinano solo le riserve effettivamente effettuate.

Per impostazione predefinita il richiedente non può approvare né confermare la preparazione del proprio ordine personale. Un altro Coordinatore deve intervenire. La pagina Impostazioni permette di attivare/disattivare esplicitamente la deroga con motivazione obbligatoria; scelta, attore e autopreparazioni sono registrati nell’audit. I report annuali interrogano tutti gli ordini dell’anno e includono quelli personali, distinguendo richiesti e preparati.

## Autorizzazioni

- `user_roles`, profili e ordini hanno RLS e sola lettura per `authenticated`: visibilità personale per gli operatori, complessiva per i Coordinatori attivi.
- Le scritture dirette dei client restano vietate. Assegnazione ruoli e impostazioni passano da procedure protette, con verifica della sessione attiva e della password personale.
- Creazione/reset Auth passano ancora dall’API server esistente e dalla chiave riservata, con riconferma della password del Coordinatore. Nessun nuovo segreto è necessario.
- L’ultimo Coordinatore attivo non può essere rimosso o disabilitato; rimuovere un ruolo invalida l’eventuale preferenza di modalità non più autorizzata.

## Verifiche

`npm test` comprende le regressioni esistenti, le policy RLS e i nuovi scenari `test-dual-roles.mjs` e `test-modes.mjs`. Il controllo PostgreSQL reale del workflow include 20 preparazioni personali concorrenti con un solo pezzo disponibile. Restano attivi typecheck, lint, build e OCR sintetico. La verifica browser locale utilizza esclusivamente account e database sintetici, con login, cambio modalità, richiesta personale, storico, report annuale, preferenza dopo reload e schermo da 360 px.

## Attivazione

Questa modifica include una migrazione e il codice applicativo coordinati. Prima della pubblicazione verificare un backup recuperabile e applicare la sola nuova migrazione a un ambiente di collaudo. Eseguire il collaudo con due Coordinatori e un Operatore, quindi applicare la migrazione e pubblicare il medesimo commit nella finestra concordata. Dopo la migrazione la vecchia interfaccia continua ad accedere alle procedure esistenti, ma la nuova interfaccia richiede le nuove procedure: pubblicare il codice nuovo solo dopo la migrazione. Non riapplicare l’intero pacchetto SQL a un database già inizializzato.

Non sono state incluse la futura gestione di tre magazzini né l’integrazione Docling.
