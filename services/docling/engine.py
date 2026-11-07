"""Local-only PDF conversion. Output is evidence for manual review, never stock."""
from pathlib import Path
import re


def extract(path: Path) -> dict:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions, RapidOcrOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling_core.types.doc import ContentLayer
    options = PdfPipelineOptions(do_ocr=True, do_table_structure=True,
                                 enable_remote_services=False, images_scale=200 / 72)
    options.ocr_options = RapidOcrOptions(force_full_page_ocr=True, scale=200 / 72)
    converter = DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})
    result = converter.convert(path, max_num_pages=20, max_file_size=12 * 1024 * 1024)
    if str(result.status.value) != 'success':
        raise ValueError('conversion_incomplete')
    doc = result.document
    # DDT number/supplier often live in page furniture, excluded by default.
    text = doc.export_to_markdown(included_content_layers=set(ContentLayer))[:80000]
    tables = []
    budget = 300
    for table in doc.tables:
        frame = table.export_to_dataframe(doc=doc).astype(str)
        frame.columns = [str(c) for c in frame.columns]
        rows = frame.iloc[:budget, :20].to_dict(orient='records')
        tables.append([{key: str(value)[:500] for key, value in row.items()} for row in rows])
        budget -= len(rows)
        if budget <= 0:
            break
    number = re.search(r'(?:DDT|BOLLA)\s*(?:N[°.º]?\s*)?[:\-]?\s*([A-Z0-9/.-]*\d[A-Z0-9/.-]*)', text, re.I)
    supplier = re.search(r'(?:fornitore|cedente|mittente|ragione sociale)\s*:\s*([^\n|]{2,120})', text, re.I)
    date = re.search(r'\b(\d{2})[/.\-](\d{2})[/.\-](20\d{2})\b', text)
    return {'text': text, 'tables': tables, 'number': number.group(1) if number else '',
            'supplier_hint': supplier.group(1).strip() if supplier else '',
            'date_hint': f'{date.group(3)}-{date.group(2)}-{date.group(1)}' if date else '',
            'dpi': 200, 'warnings': ['Verificare fornitore commerciale, unità, quantità, lotti e scadenze sul documento originale.', 'Proposte limitate a 300 righe e 20 colonne per tabella: confrontare la completezza con tutte le pagine.'],
            'verified': False}


if __name__ == '__main__':
    import json
    import sys
    Path(sys.argv[2]).write_text(json.dumps(extract(Path(sys.argv[1]))), encoding='utf-8')
