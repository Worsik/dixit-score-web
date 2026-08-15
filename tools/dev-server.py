#!/usr/bin/env python3
"""Vývojový statický server, který nebrání vidět vlastní změny.

Řeší obě vrstvy zvětralého kódu popsané v docs/DEV.md:

1. HTTP cache — `python -m http.server` neposílá Cache-Control, takže prohlížeč
   JS moduly heuristicky cachuje. Tenhle server posílá `no-store`.
2. Service worker — cachuje nezávisle na HTTP cache. Ve výchozím stavu tenhle
   server místo skutečného `sw.js` podstrčí worker, který se sám odregistruje
   a smaže cache. Aplikace tak v prohlížeči běží vždy z aktuálních souborů.

Offline režim a instalaci na plochu je potřeba testovat se skutečným workerem:

    python tools/dev-server.py 8000 --sw

Použití:  python tools/dev-server.py [port] [--sw]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ARGS = sys.argv[1:]
REAL_SW = "--sw" in ARGS
PORT = next((int(a) for a in ARGS if a.isdigit()), 8000)

# Worker, který po sobě uklidí a zmizí. Ať dev nikdy neladí starou verzi.
NEUTRAL_SW = b"""// Vlozeno tools/dev-server.py - skutecny worker spustis pres --sw
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) await caches.delete(name);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll()) client.navigate(client.url);
  })());
});
"""


class DevHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_GET(self):
        if not REAL_SW and self.path.split("?")[0].endswith("/sw.js"):
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript")
            self.send_header("Content-Length", str(len(NEUTRAL_SW)))
            self.end_headers()
            self.wfile.write(NEUTRAL_SW)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        pass  # ticho, ať je v konzoli vidět jen to podstatné


if __name__ == "__main__":
    handler = partial(DevHandler, directory=".")
    with ThreadingHTTPServer(("", PORT), handler) as server:
        print(f"Dixit Score běží na http://localhost:{PORT}  (Ctrl+C ukončí)")
        print("HTTP cache: vypnutá (no-store)")
        if REAL_SW:
            print("Service worker: SKUTEČNÝ — pro test offline režimu.")
            print("  Pozor: po úpravě souboru servíruje starou verzi, dokud ho neodregistruješ.")
        else:
            print("Service worker: neutralizovaný — sám se odregistruje a smaže cache.")
            print("  Offline režim otestuješ přepínačem --sw")
        server.serve_forever()
