'use client';
import {useActionState} from 'react';
import Link from 'next/link';
import InputField from '@/components/ui/InputField';
import PasswordInput from '@/components/ui/PasswordInput';
import {Button} from '@/components/ui/Button';
import {login,signup,resetPasswordEmail,updatePasswordEmail} from '@/lib/actions/auth';
export default function AuthForm({mode='login'}:{mode?:'login'|'signup'|'forgot'|'recovery'}){
 const fn=mode==='signup'?signup:mode==='forgot'?resetPasswordEmail:mode==='recovery'?updatePasswordEmail:login;
 const [state,action,pending]=useActionState(fn,{success:'',error:''});
 if(mode==='signup'||mode==='forgot')return <main className="welcome"><h1>Rivolgiti al coordinatore</h1><p>Gli account e il ripristino dell’accesso sono gestiti dal coordinatore.</p><Link href="/login">Torna all’accesso</Link></main>;
 const title={login:'Accedi a Gestionale Farmacia',signup:'Crea il tuo account',forgot:'Recupera la password',recovery:'Imposta la nuova password'}[mode];
 return <div className="registration"><section className="register-story"><div className="brand">Gestionale Farmacia</div><span className="eyebrow">MATERIALE SANITARIO</span><h1>Il materiale <br/>per il tuo lavoro.</h1><p>Un accesso personale per richiedere il materiale e ricevere l’avviso della farmacia.</p></section><main><span className="step">ACCOUNT PERSONALE</span><h2>{title}</h2><p>Accesso con email e password.</p><form action={action}>{mode!=='recovery'&&<InputField id="email" name="email" type="email" label="Email" placeholder="La tua email" required/>}{<PasswordInput name="password" placeholder="La tua password" hint={mode!=='login'?'Almeno 12 caratteri':undefined}/>}{state.error&&<p role="alert" className="notice error">{state.error}</p>}{state.success&&<p role="status" className="notice success">{state.success}</p>}<Button className="primary" disabled={pending} type="submit">{pending?'Attendi…':mode==='recovery'?'Salva password':'Accedi'}</Button></form><div className="status-actions"><Link href={mode==='login'?'/signup':'/login'}>{mode==='login'?'Richiedi accesso al coordinatore':'Torna all’accesso'}</Link>{mode==='login'&&<Link href="/forgot-password">Password dimenticata?</Link>}</div><p className="small">I nuovi profili vengono abilitati dal coordinatore.</p></main></div>;
}
