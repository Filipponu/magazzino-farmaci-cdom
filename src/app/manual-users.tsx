"use client";
import {useState} from 'react';
export default function ManualUsers({users,self,onDone}:{users:{id:string;first:string;last:string}[];self:string;onDone:()=>void}){
 const [secret,setSecret]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(form:FormData){setBusy(true);setError('');setSecret('');try{
 const body:Record<string,unknown>=Object.fromEntries(form);if(body.role==='both'){body.role='coordinator';body.roles=['coordinator','operator'];}const r=await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();
 if(!r.ok)throw new Error(d.error);setSecret(d.password);onDone();
 }catch(e){setError(e instanceof Error?e.message:'Operazione non riuscita.');}finally{setBusy(false);}}
 return <section className="panel"><div className="panel-title"><h2>Creazione e ripristino account</h2></div>
 {secret?<div role="status"><p>Comunica personalmente questa password temporanea. Sarà obbligatorio cambiarla al primo accesso. Non sarà recuperabile dopo la chiusura.</p><code>{secret}</code><p><button className="secondary" onClick={()=>setSecret('')}>Ho consegnato la password · Chiudi</button></p></div>:<>
 <form action={async form=>{await submit(form);}}><h3>Crea account</h3><input type="hidden" name="action" value="create"/>
 <label>Nome<input name="first" required maxLength={60}/></label><label>Cognome<input name="last" required maxLength={60}/></label><label>Email identificativa<input type="email" name="email" required maxLength={254}/></label>
 <label>Professione<select name="profession"><option>Infermiere</option><option>OSS</option><option>Fisioterapista</option></select></label>
 <label>Ruoli applicativi<select name="role"><option value="operator">Operatore</option><option value="coordinator">Coordinatore</option><option value="both">Coordinatore e Operatore</option></select></label>
 <label>La tua password di coordinatore<input name="current_password" type="password" autoComplete="current-password" required maxLength={256}/></label><button className="primary" disabled={busy}>Crea account</button></form>
 <form action={async form=>{await submit(form);}}><h3>Ripristina accesso</h3><p>Revoca le sessioni precedenti e genera una nuova password temporanea.</p><input type="hidden" name="action" value="reset"/>
 <label>Account<select name="id" required><option value="">Seleziona</option>{users.filter(u=>u.id!==self).map(u=><option key={u.id} value={u.id}>{u.first} {u.last}</option>)}</select></label>
 <label>La tua password di coordinatore<input name="current_password" type="password" autoComplete="current-password" required maxLength={256}/></label><button className="secondary" disabled={busy}>Ripristina accesso</button></form></>}
 {error&&<p role="alert" className="notice error">{error}</p>}</section>;
}
