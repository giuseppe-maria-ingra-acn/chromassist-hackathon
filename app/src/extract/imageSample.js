/**
 * Campiona il colore dominante di una fotografia prodotto.
 *
 * È l'unica fonte del colore vero quando la pagina non contiene esadecimali.
 * Richiede crossOrigin: senza, il canvas viene contaminato e getImageData
 * solleva SecurityError. Funziona solo se il server manda header CORS
 * permissivi — da verificare per ogni catalogo nuovo.
 */
/**
 * Distanza RGB entro cui due tinte si considerano la stessa, ombreggiata.
 * Tarata su fotografie di catalogo reali.
 */
const VICINANZA_TINTA = 60;

/**
 * Quota minima di pixel che devono stare attorno alla tinta dominante
 * perché il capo si consideri monocolore. Misurato sul campo: i capi a
 * tinta unita stanno fra 76% e 99%.
 */
const COESIONE_MINIMA = 0.55;

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

        /*
         * Si cerca il colore attorno al quale si concentra PIU MASSA, non il
         * gruppo di pixel più numeroso.
         *
         * La differenza è decisiva su una fotografia indossata. Misurato su
         * una giacca beige fotografata su modello: il capo intimo scuro forma
         * un unico gruppo compatto al 27% dei pixel, mentre il beige della
         * giacca è spezzato dall'ombreggiatura in nove gruppi che valgono
         * insieme il 50%. Ancorandosi al gruppo più numeroso si otteneva nero
         * su un capo beige.
         *
         * Per ogni candidato si misura la massa che gli sta intorno, e vince
         * quello con l'intorno più pesante. I candidati sotto il 2% si
         * ignorano: sono riflessi e dettagli, e valutarli tutti costerebbe
         * tempo senza cambiare l'esito.
         */
        const gruppi = [...bucket.values()]
          .map((e) => ({ colore: [0, 1, 2].map((i) => Math.round(e[i] / e[3])), peso: e[3] }))
          .sort((a, b) => b.peso - a.peso);

        const intorno = (riferimento) => {
          let peso = 0;
          const somma = [0, 0, 0];
          for (const g of gruppi) {
            const distanza = Math.hypot(
              g.colore[0] - riferimento[0],
              g.colore[1] - riferimento[1],
              g.colore[2] - riferimento[2]
            );
            if (distanza >= VICINANZA_TINTA) continue;
            peso += g.peso;
            for (let i = 0; i < 3; i++) somma[i] += g.colore[i] * g.peso;
          }
          return { peso, colore: somma.map((v) => Math.round(v / peso)) };
        };

        const candidati = gruppi.filter((g) => g.peso / considerati >= 0.02).slice(0, 25);
        const vincente = (candidati.length ? candidati : [gruppi[0]])
          .map((g) => intorno(g.colore))
          .sort((a, b) => b.peso - a.peso)[0];

        risolvi({
          hex: '#' + vincente.colore.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase(),
          // Nessuna tinta prevalente: il capo è fantasia o multicolore.
          // Va dichiarato, non mediato in un valore privo di senso.
          multicolore: vincente.peso / considerati < COESIONE_MINIMA
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
