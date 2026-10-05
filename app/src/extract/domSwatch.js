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
    if (!hex && typeof getComputedStyle === 'function') {
      const calcolato = getComputedStyle(el).backgroundColor;
      if (calcolato) hex = rgbToHex(calcolato);
    }

    const img = el.querySelector('img')?.getAttribute('src') ?? el.getAttribute('data-image') ?? null;
    out.push({ nome, hex, imageUrl: img });
  }
  return out;
}

function rgbToHex(valore) {
  const m = String(valore).match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return null;
  const [r, g, b] = m.slice(1, 4).map(Number);
  if (r === 0 && g === 0 && b === 0 && !/rgb/.test(valore)) return null;
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
