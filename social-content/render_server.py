from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/save":
            self.send_error(404)
            return
        name = Path(parse_qs(parsed.query).get("name", ["video.webm"])[0]).name
        length = int(self.headers.get("Content-Length", "0"))
        data = self.rfile.read(length)
        target = OUT / name
        target.write_bytes(data)
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(str(target).encode("utf-8"))

    def log_message(self, format, *args):
        return

if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8766), Handler).serve_forever()
