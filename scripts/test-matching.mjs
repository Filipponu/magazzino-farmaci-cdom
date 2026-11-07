import assert from 'node:assert/strict';
import {matchOcr} from '../src/lib/pharmacy/matching.ts';
const articles=[{supplier_id:'A',product_id:1,code:'AB-010'},{supplier_id:'A',product_id:2,code:'AB-O10'},{supplier_id:'B',product_id:3,code:'AB-010'}];
const result=matchOcr({tables:[[
 {Codice:'AB-010',Quantità:'12',Lotto:'TEST-1',Scadenza:'2099-12-31'},
 {Codice:'AB-O10',Quantità:'1,000'},
 {Codice:'AB010',Quantità:'-2'},
 {Codice:'AB-010?',Quantità:'10 confezioni'},
]]},articles,'A');
assert.equal(result[0].id,1);assert.equal(result[0].qty,'12');assert.equal(result[0].uncertain,true);
assert.equal(result[1].id,2);assert.equal(result[1].qty,'');
assert.equal(result[2].id,0);assert.equal(result[2].qty,'');
assert.equal(result[3].id,0);assert.equal(result[3].qty,'');
assert.equal(matchOcr({tables:[[{Codice:'AB-010'}]]},articles,'B')[0].id,3);
assert.equal(matchOcr({tables:[[{Scadenza:'31/12/2099'}]]},articles,'A')[0].expires,'2099-12-31');
assert.equal(matchOcr({tables:[[{Scadenza:'31/02/2099'}]]},articles,'A')[0].expires,'');
console.log('PASS: codici simili distinti, fornitore commerciale, quantità ambigue escluse, revisione sempre obbligatoria.');
