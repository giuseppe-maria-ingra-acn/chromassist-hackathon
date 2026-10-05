/**
 * Dati strutturati schema.org. Il campo `color` esiste, ma contiene una
 * STRINGA commerciale, non un valore colore: va preso come nome.
 */
export function parse(doc) {
  const out = [];
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let dati;
    try {
      dati = JSON.parse(script.textContent);
    } catch {
      continue; // JSON-LD malformato è comune: si ignora, non si fallisce
    }
    for (const nodo of [].concat(dati)) {
      for (const variante of [].concat(nodo?.hasVariant ?? [])) {
        if (variante?.color) out.push({ nome: String(variante.color), hex: null, imageUrl: variante.image ?? null });
      }
      if (nodo?.color && !nodo?.hasVariant) out.push({ nome: String(nodo.color), hex: null, imageUrl: nodo.image ?? null });
    }
  }
  return out;
}
