/**
 * Campiona il colore dominante di una fotografia prodotto.
 *
 * È l'unica fonte del colore vero quando la pagina non contiene esadecimali.
 * Richiede crossOrigin: senza, il canvas viene contaminato e getImageData
 * solleva SecurityError. Funziona solo se il server manda header CORS
 * permissivi — da verificare per ogni catalogo nuovo.
 */
export function campionaImmagine(url) {
  return new Promise((risolvi) => {
    const im = new Image();

    // crossOrigin va impostato SOLO per immagini di altra origine.
    // Su un'immagine della stessa origine trasforma la richiesta in una
    // richiesta CORS, e un server che non manda Access-Control-Allow-Origin
    // la fa fallire del tutto — l'immagine non carica, e il colore si perde.
    // Molti server statici di sviluppo non mandano quell'intestazione.
    if (altraOrigine(url)) im.crossOrigin = 'anonymous';

    im.onerror = () => risolvi(null);
    im.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = im.naturalWidth;
        c.height = im.naturalHeight;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0);

        // il capo sta al centro: i bordi sono sfondo
        const x = Math.floor(c.width * 0.28);
        const y = Math.floor(c.height * 0.25);
        const w = Math.max(1, Math.floor(c.width * 0.44));
        const h = Math.max(1, Math.floor(c.height * 0.5));
        const d = cx.getImageData(x, y, w, h).data;

        const bucket = new Map();
        let considerati = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          if (max > 228 && max - min < 22) continue; // sfondo chiaro e desaturato
          considerati++;
          const k = `${r >> 4},${g >> 4},${b >> 4}`;
          const e = bucket.get(k) ?? [0, 0, 0, 0];
          e[0] += r; e[1] += g; e[2] += b; e[3]++;
          bucket.set(k, e);
        }
        if (!considerati) return risolvi(null);

        const ordinati = [...bucket.values()].sort((a, b) => b[3] - a[3]);
        const top = ordinati[0];
        const quota = top[3] / considerati;

        risolvi({
          hex: '#' + [0, 1, 2].map((i) => Math.round(top[i] / top[3]).toString(16).padStart(2, '0')).join('').toUpperCase(),
          // nessun colore dominante: il capo è fantasia o multicolore.
          // Va dichiarato, non mediato in un valore privo di senso.
          multicolore: quota < 0.3
        });
      } catch {
        risolvi(null);
      }
    };
    im.src = url;
  });
}

/** Vero se l'immagine sta su un'origine diversa da quella della pagina. */
function altraOrigine(url) {
  try {
    return new URL(url, location.href).origin !== location.origin;
  } catch {
    return false; // percorso relativo non risolvibile: trattalo come locale
  }
}
