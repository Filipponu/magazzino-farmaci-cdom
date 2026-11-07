"""Synthetic PDFs only. Run pytest here; -- real OCR is a separate integration test."""
import hashlib
import importlib
import os
import secrets
import sys
import tempfile
from pathlib import Path

ROOT = Path(tempfile.mkdtemp(prefix='cdom-synthetic-'))
os.environ['DOCLING_DATA_DIR'] = str(ROOT)
os.environ['DOCLING_API_TOKEN'] = secrets.token_urlsafe(48)
sys.path.insert(0, str(Path(__file__).parent))
service = importlib.import_module('app')
from fastapi.testclient import TestClient
import pymupdf


def synthetic_pdf(difficult=False):
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((40, 50), 'DDT N. SYNTH-2026-001 - 07/11/2026', fontsize=12)
    page.insert_text((40, 85), 'Fornitore Sintetico A - SOLO COLLAUDO', fontsize=12)
    headers = ['Codice', 'Prodotto', 'Quantita', 'Lotto', 'Scadenza']
    values = ['AB-010', 'Garza sintetica', '12', 'TEST-01', '2099-12-31']
    xs = [40, 125, 290, 365, 450]
    for y, row in [(130, headers), (165, values)]:
        for x, text in zip(xs, row):
            page.insert_text((x, y), text, fontsize=9 if difficult else 11)
    for y in [110, 140, 180]:
        page.draw_line((35, y), (560, y))
    for x in [35, 120, 280, 355, 440, 560]:
        page.draw_line((x, 110), (x, 180))
    # Image-only PDF at exactly 200 DPI, not an embedded text layer.
    pix = page.get_pixmap(dpi=200)
    scanned = pymupdf.open()
    target = scanned.new_page(width=page.rect.width, height=page.rect.height)
    target.insert_image(target.rect, pixmap=pix)
    data = scanned.tobytes()
    doc.close(); scanned.close()
    return data


def test_auth_duplicate_validation_and_errors(monkeypatch):
    # Test queue/API contract with an explicit failure double. Real OCR separately.
    monkeypatch.setattr(service, 'run_engine', lambda path, output: (_ for _ in ()).throw(ValueError('synthetic error')))
    headers = {'Authorization': 'Bearer ' + os.environ['DOCLING_API_TOKEN'], 'Content-Type': 'application/pdf'}
    data = synthetic_pdf()
    with TestClient(service.app) as client:
        assert client.post('/jobs', content=data).status_code == 401
        assert client.post('/jobs', headers={**headers, 'Authorization': 'Bearer wrong'}, content=data).status_code == 401
        assert client.post('/jobs', headers=headers, content=b'%PDF-invalid').status_code == 422
        assert client.post('/jobs', headers=headers, content=b'a' * (12 * 1024 * 1024 + 1)).status_code == 413
        first = client.post('/jobs', headers=headers, content=data)
        assert first.status_code == 202
        job = first.json()['job']
        assert job == hashlib.sha256(data).hexdigest()
        assert client.post('/jobs', headers=headers, content=data).json()['duplicate']
        assert client.get('/jobs/' + job, headers=headers).status_code == 200
        assert client.get('/jobs/' + '0'*64, headers=headers).status_code == 404
    # Verify persisted failure and no leaked exception text.
    service.convert(job)
    with service.db() as con:
        row = con.execute('select status,error from jobs where id=?',(job,)).fetchone()
    assert row['status'] == 'failed'
    assert 'synthetic error' not in row['error']


if __name__ == '__main__':
    from engine import extract
    path = ROOT / 'difficult-synthetic-200dpi.pdf'
    path.write_bytes(synthetic_pdf(difficult=True))
    result = extract(path)
    assert result['verified'] is False
    assert result['dpi'] == 200
    assert 'SYNTH' in result['text'].upper()
    assert len(result['tables']) >= 1
    print('PASS: real Docling on synthetic image-only 200 DPI PDF, text and table extraction; manual review required.')
