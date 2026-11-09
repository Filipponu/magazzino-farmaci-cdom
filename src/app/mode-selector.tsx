'use client';
import LabeledSelect from '@/components/ui/LabeledSelect';
import type {AppRole} from '@/lib/pharmacy/modes';
export default function ModeSelector({mode,disabled,onChange}:{mode:AppRole;disabled:boolean;onChange:(mode:AppRole)=>void}){
 return <div className="mode-selector"><LabeledSelect id="application-mode" label="Modalità" value={mode} disabled={disabled} onChange={e=>onChange(e.target.value as AppRole)}><option value="coordinator">Coordinatore</option><option value="operator">Operatore</option></LabeledSelect></div>;
}
