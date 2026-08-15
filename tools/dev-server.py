#!/usr/bin/env python3
"""Vývojový statický server, který zakazuje cachování.

`python -m http.server` neposílá žádné Cache-Control, takže prohlížeč JS moduly
heuristicky cachuje a po úpravě souboru servíruje starou verzi. Spolu se service
workerem vzniknou dvě nezávislé vrstvy zvětralého kódu a ladí se pak přelud.

Použití:  python tools/dev-server.py [port]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # ticho, ať je v konzoli vidět jen to podstatné


if __name__ == "__main__":
    handler = partial(NoCacheHandler, directory=".")
    with ThreadingHTTPServer(("", PORT), handler) as server:
        print(f"Dixit Score běží na http://localhost:{PORT}  (bez cachování, Ctrl+C ukončí)")
        print("Pozor: service worker cachuje nezávisle - v DevTools zapni 'Update on reload'.")
        server.serve_forever()
