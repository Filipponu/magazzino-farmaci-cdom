"""Local-only PDF conversion. Output is evidence for manual review, never stock."""
from pathlib import Path
import re


def extract(path: Path) -> dict:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions, RapidOcrOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption
    options = PdfPipelineOptions(do_ocr=True, do_table_structure=True,
                                 enable_remote_services=False, images_scale=200 / 72)
    options.ocr_options = RapidOcrOptions(force_full_page_ocr=True, scale=200 / 72)
    converter = DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)})
    result = converter.convert(path, max_num_pages=20, max_file_size=12 * 1024 * 1024)
    if str(result.status.value) != 'success':
        raise ValueError('conversion_incomplete')
    doc = result.document
    text = doc.export_to_markdown()[:80000]
    tables = [t.export_to_dataframe(doc=doc).astype(str).to_dict(orient='records') for t in doc.tables]
    number = re.search(r'(?:DDT|BOLLA)\s*(?:N[°.º]?\s*)?[:\-]?\s*([A-Z0-9/.-]*\d[A-Z0-9/.-]*)', text, re.I)
    return {'text': text, 'tables': tables, 'number': number.group(1) if number else '',
            'dpi': 200, 'warnings': ['Verificare fornitore commerciale, unità, quantità, lotti e scadenze sul documento originale.'],
            'verified': False}


if __name__ == '__main__':
    import json
    import sys
    Path(sys.argv[2]).write_text(json.dumps(extract(Path(sys.argv[1]))), encoding='utf-8')
