"""Single-process durable SQLite job queue. No Supabase credentials on the VPS."""
import asyncio
from contextlib import asynccontextmanager
import hashlib
import hmac
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import time
from fastapi import FastAPI, Header, HTTPException, Request, Depends

ROOT = Path(os.environ.get('DOCLING_DATA_DIR', './data'))
TOKEN = os.environ.get('DOCLING_API_TOKEN', '')
MAX_BYTES = 12 * 1024 * 1024


def db():
    connection = sqlite3.connect(ROOT / 'jobs.sqlite', timeout=30)
    connection.row_factory = sqlite3.Row
    return connection


def initialize():
    ROOT.mkdir(parents=True, exist_ok=True)
    with db() as con:
        con.execute('create table if not exists jobs(id text primary key,status text,result text,error text,created real)')
        con.execute("update jobs set status='queued' where status='running'")


def authorized(authorization: str = Header(default='')):
    if len(TOKEN) < 32:
        raise HTTPException(503, 'OCR non configurato')
    if not hmac.compare_digest(authorization, 'Bearer ' + TOKEN):
        raise HTTPException(401, 'Non autorizzato')


def run_engine(path, output):
    subprocess.run([sys.executable, str(Path(__file__).with_name('engine.py')), str(path), str(output)],
                   check=True, timeout=240, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return json.loads(output.read_text(encoding='utf-8'))


def convert(job):
    output = ROOT / (job + '.json')
    try:
        result = run_engine(ROOT / (job + '.pdf'), output)
        status, error = 'done', None
    except Exception:
        # No raw OCR / file paths / stack traces in API errors.
        result, status, error = None, 'failed', 'Conversione non riuscita. Verificare il PDF o compilare manualmente.'
    with db() as con:
        con.execute('update jobs set status=?,result=?,error=? where id=?',
                    (status, json.dumps(result) if result else None, error, job))
    (ROOT / (job + '.pdf')).unlink(missing_ok=True)
    output.unlink(missing_ok=True)


async def worker():
    while True:
        with db() as con:
            # Seven-day retention, including failed jobs. Dedupe is permanent in Supabase.
            old = con.execute('select id from jobs where created<?', (time.time() - 604800,)).fetchall()
            for row in old:
                (ROOT / (row['id'] + '.pdf')).unlink(missing_ok=True)
            con.execute('delete from jobs where created<?', (time.time() - 604800,))
            row = con.execute("select id from jobs where status='queued' order by created limit 1").fetchone()
            if row:
                con.execute("update jobs set status='running' where id=?", (row['id'],))
        if row:
            await asyncio.to_thread(convert, row['id'])
        else:
            await asyncio.sleep(1)


@asynccontextmanager
async def lifespan(_app):
    initialize()
    task = asyncio.create_task(worker())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None,
              dependencies=[Depends(authorized)])


@app.post('/jobs', status_code=202)
async def submit(request: Request):
    if request.headers.get('content-type') != 'application/pdf':
        raise HTTPException(415, 'Inviare PDF')
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > MAX_BYTES:
            raise HTTPException(413, 'PDF troppo grande')
    if not data.startswith(b'%PDF-'):
        raise HTTPException(422, 'PDF non valido')
    # Parse before enqueue to reject encrypted, malformed and excessive-page PDFs.
    import pymupdf
    try:
        with pymupdf.open(stream=bytes(data), filetype='pdf') as pdf:
            if pdf.is_encrypted or not 1 <= len(pdf) <= 20:
                raise ValueError('PDF non supportato')
    except Exception:
        raise HTTPException(422, 'PDF cifrato, danneggiato o oltre 20 pagine')
    job = hashlib.sha256(data).hexdigest()
    with db() as con:
        found = con.execute('select status,created from jobs where id=?', (job,)).fetchone()
        retry = found and found['status'] == 'failed' and time.time() - found['created'] > 60
        if not found or retry:
            if con.execute("select count(*) from jobs where status in ('queued','running')").fetchone()[0] >= 20:
                raise HTTPException(429, 'Coda OCR piena. Riprovare più tardi.')
            (ROOT / (job + '.pdf')).write_bytes(data)
            con.execute("insert into jobs values(?,'queued',null,null,?) on conflict(id) do update set status='queued',result=null,error=null,created=excluded.created", (job, time.time()))
    return {'job': job, 'status': found['status'] if found and not retry else 'queued', 'duplicate': bool(found and not retry)}


@app.get('/jobs/{job}')
def status(job: str):
    if len(job) != 64 or any(c not in '0123456789abcdef' for c in job):
        raise HTTPException(404, 'Job non trovato')
    with db() as con:
        row = con.execute('select * from jobs where id=?', (job,)).fetchone()
    if not row:
        raise HTTPException(404, 'Job non trovato')
    return {'job': job, 'status': row['status'], 'result': json.loads(row['result']) if row['result'] else None, 'error': row['error']}
