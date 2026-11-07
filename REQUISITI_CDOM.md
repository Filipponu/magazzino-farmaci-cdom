# Requisiti funzionali C-DOM — coordinatore e operatore

## Configurazione coordinatore
- Email coordinatore: `monica.silini@finister.medicare.it` (indirizzo comunicato dall'utente; da verificare prima di attivare notifiche o invii).
- Usare questa email per l'account coordinatore e come destinatario delle notifiche di richieste da autorizzare, dopo verifica dell'indirizzo e delle impostazioni di accesso.

## Ruoli
- Operatore: catalogo prodotti, richiesta materiali, stato richieste, storico personale. Non modifica giacenze o limiti.
- Coordinatore: prodotti, fornitori, giacenze, lotti, scadenze, bolle, richieste, autorizzazioni, audit.
- Fornitori associabili ai prodotti (es. B. Braun, Angelini, Prontosan come linea prodotto); evitare di confondere marca e fornitore.

## Limiti mensili per prodotto
- Il coordinatore può abilitare un limite mensile quantitativo per ciascun prodotto. Il valore è identico per tutti gli operatori, ma il conteggio è separato per operatore e prodotto nel mese di calendario Europe/Rome.
- La prima richiesta del mese per un prodotto limitato può essere approvata automaticamente SOLO se entro il limite, con disponibilità e controlli di sicurezza soddisfatti.
- La seconda e ogni richiesta successiva dello stesso operatore per quel prodotto nel mese richiede approvazione del coordinatore, anche se entro il limite.
- Qualunque richiesta che superi il tetto mensile richiede approvazione esplicita del coordinatore; non evadere o scaricare giacenza prima dell'approvazione.
- Una richiesta respinta o annullata non consuma il tetto quantitativo; definire e testare se conta come prima richiesta: proposta, conta solo una richiesta approvata.
- L'operatore può inoltrare richieste successive come 'in attesa', mai aggirare il controllo spezzando ordini.
- Il coordinatore può approvare, respingere o ridurre quantità, con motivazione obbligatoria per superamenti ed eccezioni.
- Storico permanente; reset logico dei conteggi per nuovo mese, senza cancellare dati.

## Requisiti tecnici
- Applicare autorizzazione e limiti lato server/database in transazione atomica, non solo in UI. Gestire richieste simultanee, idempotenza e autorizzazioni di ruolo.
- Registrare eventi audit (utente, prodotto, quantità, data, decisione, motivazione), con timestamp UTC e calendario locale per i limiti.
- Separare ambienti test/produzione; dataset sintetico di almeno 500 movimenti, inclusi duplicati, lotti scaduti, giacenze insufficienti, richieste concorrenti e limiti superati.
- Nessun dato reale di pazienti nei test. Verificare permessi Supabase RLS e variabili d'ambiente prima del deploy.

## Criteri di accettazione
1. Operatore A: prima richiesta 6 su limite 10 approvata, seconda 3 in attesa.
2. Operatore A: seconda richiesta 5 su limite 10 in attesa con indicazione di superamento.
3. Operatore B: prima richiesta 10 sullo stesso prodotto autonoma rispetto ad A.
4. Coordinatore approva superamento con motivazione: ordine tracciato.
5. Operatore non può approvare richieste proprie via API o client.
6. Il primo giorno del mese nuovo il conteggio riparte senza perdere lo storico.
