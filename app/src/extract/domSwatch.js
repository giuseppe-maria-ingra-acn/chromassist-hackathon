/**
 * Gli swatch presenti nel DOM. Raccoglie nome, eventuale colore e immagine.
 *
 * Il colore può arrivare da tre punti diversi, che coesistono nello stesso
 * catalogo. Si tentano in ordine; se nessuno lo fornisce, hex resta null e
 * il colore andrà campionato dalla fotografia.
 */
export function parse(doc) {
  const out = [];
  for (const el of doc.querySelectorAll('[data-variant]')) {
    const nome = el.getAttribute('data-variant')?.trim();
    if (!nome) continue;

    let hex = null;

    // 1. attributo dati, con o senza cancelletto
    const attr = el.getAttribute('data-colour-hex');
    if (attr && /^#?[0-9a-fA-F]{6}$/.test(attr.trim())) hex = '#' + attr.trim().replace(/^#/, '');

    // 2. stile inline
    if (!hex) {
      const inline = el.style?.backgroundColor;
      if (inline) hex = rgbToHex(inline);
    }

    // 3. classe CSS, con il valore in un foglio di stile altrove
    //
    // Si legge il colore calcolato SOLO se l'elemento non ha un'immagine di
    // sfondo. Con un'immagine sopra, il colore dietro non è il colore della
    // variante: è il fondo su cui la miniatura è disegnata. Su un <button>
    // quel fondo è il grigio di default del sistema (buttonface), che
    // scambiato per il colore del capo manda l'intera analisi fuori strada.
    if (!hex && typeof getComputedStyle === 'function') {
      const stile = getComputedStyle(el);
      const haImmagine = stile.backgroundImage && stile.backgroundImage !== 'none';
      if (!haImmagine) hex = rgbToHex(stile.backgroundColor);
    }

    const img = el.querySelector('img')?.getAttribute('src') ?? el.getAttribute('data-image') ?? null;
    out.push({ nome, hex, imageUrl: img });
  }
  return out;
}

/**
 * Converte un valore CSS di colore in esadecimale, scartando ciò che non è
 * un colore.
 *
 * Il caso che conta: un elemento senza background-color restituisce
 * `rgba(0, 0, 0, 0)` — trasparente. Accettarlo significa registrare nero come
 * colore della variante, e il dato finto è peggio del dato mancante: l'analisi
 * prosegue su un valore sbagliato invece di dichiarare che non lo conosce.
 */
function rgbToHex(valore) {
  const testo = String(valore).trim();
  if (!testo || testo === 'transparent' || testo === 'none') return null;

  const m = testo.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.%]+))?/);
  if (!m) return null;

  // alpha a zero, o quasi: l'elemento non ha un colore di fondo proprio
  if (m[4] !== undefined) {
    const a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    if (!(a > 0.5)) return null;
  }

  const [r, g, b] = m.slice(1, 4).map((v) => Math.round(Number(v)));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
