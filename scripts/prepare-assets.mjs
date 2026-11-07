import {mkdir,copyFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url),root=process.cwd();
const tess=path.dirname(require.resolve('tesseract.js/package.json'));
const core=path.dirname(require.resolve('tesseract.js-core/package.json'));
const lang=path.dirname(require.resolve('@tesseract.js-data/ita/package.json'));
const pdf=path.dirname(require.resolve('pdfjs-dist/package.json'));
for(const dir of ['public/ocr/core','public/ocr/languages'])await mkdir(path.join(root,dir),{recursive:true});
await copyFile(path.join(tess,'dist/worker.min.js'),'public/ocr/worker.min.js');
for(const file of await readdir(core))if(file.endsWith('-lstm.wasm.js'))await copyFile(path.join(core,file),path.join(root,'public/ocr/core',file));
await copyFile(path.join(lang,'4.0.0/ita.traineddata.gz'),'public/ocr/languages/ita.traineddata.gz');
await copyFile(path.join(pdf,'build/pdf.worker.min.mjs'),'public/ocr/pdf.worker.min.mjs');
for(const [dir,prefix] of [[tess,'tesseract'],[core,'core'],[pdf,'pdfjs']]){const license=(await readdir(dir)).find(f=>/^license/i.test(f));if(license)await copyFile(path.join(dir,license),`public/ocr/LICENSE-${prefix}.txt`);}
console.log('Asset OCR e PDF preparati localmente dalle dipendenze.');
