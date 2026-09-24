"""Real Chrome CLI runner. No Playwright, Puppeteer, CDP client or DOM emulator."""
import signal, functools, http.server, html, json, os, pathlib, re, shutil, subprocess, tempfile, threading
root=pathlib.Path(__file__).resolve().parents[1]
chrome=os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium') or '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
if not pathlib.Path(chrome).exists(): raise SystemExit('Set CHROME_BIN or open tests/browser.html through npm run serve.')
class QuietHandler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*_): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 work=root/'work'
 work.mkdir(exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='browser-',dir=work) as profile:
  command=[chrome,'--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--disable-gpu','--window-size=1280,900','--user-data-dir='+profile,'--dump-dom','--virtual-time-budget=30000',f'http://127.0.0.1:{server.server_port}/tests/browser.html']
  proc=subprocess.Popen(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
  try:
   stdout,stderr=proc.communicate(timeout=60)
  except subprocess.TimeoutExpired:
   os.killpg(proc.pid,signal.SIGTERM)
   try: stdout,stderr=proc.communicate(timeout=5)
   except subprocess.TimeoutExpired:
    os.killpg(proc.pid,signal.SIGKILL);stdout,stderr=proc.communicate()
   raise SystemExit('Chrome CLI startup/test timed out. Run npm run serve and open /tests/browser.html in an installed browser.\n'+stderr[-1500:])
 match=re.search(r'<pre id="results">(.*?)</pre>',stdout,re.S)
 if not match or 'data-test-status=' not in stdout: raise SystemExit('Suite incomplete\n'+stdout[-2000:]+'\n'+stderr[-2000:])
 report=json.loads(html.unescape(match.group(1)))
 (root/'docs'/'test-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 for test in report['tests']: print(test['status'].upper()+': '+test['name']+ ('\n'+test['error'] if 'error' in test else ''))
 for benchmark in report['benchmarks']: print(json.dumps(benchmark,ensure_ascii=False))
 print(f"Browser tests: {report['passed']} passed, {report['failed']} failed")
 raise SystemExit(1 if report['failed'] else 0)
finally:
 server.shutdown();server.server_close()
