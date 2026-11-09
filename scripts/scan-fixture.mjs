import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
// The fixture must render identically on Linux CI and Windows workstations.
if(!GlobalFonts.registerFromPath(require.resolve('pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf'),'CdomScanFixture'))throw new Error('Font del documento OCR sintetico non disponibile.');
/** Two image-only pages. No text layer; all identities/materials synthetic. */
export function scannedFixture(){
 const images=[0,1].map(i=>{const canvas=createCanvas(1654,2339),c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,1654,2339);c.fillStyle='black';c.font='32px CdomScanFixture';c.fillText('DDT N. TEST-2026-001  Data 07/11/2026',80,100);c.fillText('Fornitore Sintetico Alfa',80,170);const xs=[80,370,1000,1190,1400];c.font='34px CdomScanFixture';['Codice','Descrizione','Quantita','Lotto','Scadenza'].forEach((t,j)=>c.fillText(t,xs[j],300));const row=i===0?['TEST-010','Garza sintetica','12','LOT-A','31/12/2099']:['TEST-O10','Presidio sintetico','3','',''];row.forEach((t,j)=>c.fillText(t,xs[j],380));return canvas.toBuffer('image/jpeg',95);});
 const objects=[null,null],add=data=>(objects.push(Buffer.isBuffer(data)?data:Buffer.from(data)),objects.length);
 const pages=[];
 for(const image of images){const img=add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width 1654 /Height 2339 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),image,Buffer.from('\nendstream')]));const content='q 595 0 0 842 0 0 cm /Scan Do Q';const stream=add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);pages.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Scan ${img} 0 R >> >> /Contents ${stream} 0 R >>`));}
 objects[0]=Buffer.from('<< /Type /Catalog /Pages 2 0 R >>');objects[1]=Buffer.from(`<< /Type /Pages /Count 2 /Kids [${pages.map(p=>p+' 0 R').join(' ')}] >>`);
 const chunks=[Buffer.from('%PDF-1.4\n')],offsets=[0];let length=chunks[0].length;
 objects.forEach((data,i)=>{offsets.push(length);const chunk=Buffer.concat([Buffer.from(`${i+1} 0 obj\n`),data,Buffer.from('\nendobj\n')]);chunks.push(chunk);length+=chunk.length;});
 chunks.push(Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF`));return Buffer.concat(chunks);
}
