#!/usr/bin/env python3
"""
Server statico per lo sviluppo, con la cache disattivata.

`python3 -m http.server` memorizza i moduli ES in modo aggressivo e ognuno
indipendentemente dagli altri: modificando un singolo modulo il browser può
continuare a eseguire la versione precedente anche dopo un ricaricamento
forzato, e si finisce a cercare un bug già corretto.

Uso:
    python3 serve.py          # porta 4173
    python3 serve.py 8080
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class SenzaCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, formato, *argomenti):
        # il log di default è rumoroso durante una demo
        if "404" in str(argomenti) or "500" in str(argomenti):
            super().log_message(formato, *argomenti)


def main():
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    gestore = partial(SenzaCache, directory=".")
    with ThreadingHTTPServer(("", porta), gestore) as server:
        print(f"ChromAssist su http://localhost:{porta}  (cache disattivata)")
        print("Ctrl+C per fermare")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nfermato")


if __name__ == "__main__":
    main()
