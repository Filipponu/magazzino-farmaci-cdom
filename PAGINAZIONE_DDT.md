# Archivio DDT completo

Nuova RPC pharmacy_delivery_page con controllo coordinatore invariato. La API GET dell’archivio usa la nuova RPC: 25 documenti per pagina, conteggio totale, navigazione e ricerca lato database per fornitore, numero, data esatta e intervallo inclusivo. I filtri si combinano e «Azzera filtri» torna alla prima pagina. Ordinamento per data DDT decrescente, documenti senza data in fondo, poi data caricamento e ID decrescenti per stabilità. Un inserimento tra richieste di pagine può spostare i documenti; non è una fotografia immutabile dell’archivio.

Il dettaglio è recuperabile per ID indipendentemente dai filtri; serve anche per continuare upload e revisione quando la bolla non è nella pagina attuale. Bucket, policy, URL firmati, OCR e procedure POST di carico rimangono invariati. La RPC storica pharmacy_deliveries resta disponibile per compatibilità; l’interfaccia aggiornata non la usa più.

Configurazione futura: applicare SOLO supabase/migrations/202611080002_delivery_pagination.sql dopo le migrazioni esistenti, sul Supabase test. Non applicata in cloud durante lo sviluppo. Aggiunge un indice e una funzione di lettura; non modifica righe DDT, giacenze o documenti Storage. L’indice richiede un lock durante la creazione, da pianificare prima del collaudo. Non rieseguire lo schema iniziale completo.

Test sintetico: 601 documenti consultati oltre il precedente limite 200, ID unici, filtri e date, permessi anon/operatore, ricerca letterale resistente a injection, pagina fuori limite, nessuna movimentazione. Nessun deploy o modifica VPS.
