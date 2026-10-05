import { parse as titleSuffix } from './titleSuffix.js';
import { parse as jsonLd } from './jsonLd.js';
import { parse as domSwatch } from './domSwatch.js';
import { campionaImmagine } from './imageSample.js';

/**
 * Registro dei parser. L'ordine è il fallback: il primo che restituisce
 * varianti vince per i NOMI; i colori vengono poi completati, variante per
 * variante, da chi riesce a fornirli.
 *
 * Contratto di ogni parser:
 *   parse(doc) → [{ nome, hex|null, imageUrl|null }]
 *   - nome: SEMPRE il testo del venditore, verbatim
 *   - hex:  null se la pagina non lo contiene. Mai dedotto dal nome.
 */
const PARSER = [
  { id: 'dom-swatch', parse: domSwatch },
  { id: 'json-ld', parse: jsonLd },
  { id: 'title-suffix', parse: titleSuffix }
];

/** Unisce i risultati dei parser, preservando i nomi e completando i colori. */
export function estrai(doc) {
  const perNome = new Map();
  const fonti = [];

  for (const { id, parse } of PARSER) {
    let trovate = [];
    try {
      trovate = parse(doc) ?? [];
    } catch {
      continue; // un parser che non si applica non deve fermare gli altri
    }
    if (!trovate.length) continue;
    fonti.push(id);
    for (const v of trovate) {
      const esistente = perNome.get(v.nome);
      if (!esistente) perNome.set(v.nome, { ...v });
      else {
        if (!esistente.hex && v.hex) esistente.hex = v.hex;
        if (!esistente.imageUrl && v.imageUrl) esistente.imageUrl = v.imageUrl;
      }
    }
  }
  return { varianti: [...perNome.values()], fonti };
}

/**
 * Completa i colori mancanti campionando le fotografie.
 * È l'unica via quando la pagina non contiene esadecimali — il caso più
 * frequente sui cataloghi reali.
 */
export async function completaDaImmagini(varianti) {
  const esiti = await Promise.all(
    varianti.map(async (v) => {
      if (v.hex || !v.imageUrl) return v;
      const campionato = await campionaImmagine(v.imageUrl);
      return campionato
        ? { ...v, hex: campionato.hex, daImmagine: true, multicolore: campionato.multicolore }
        : v;
    })
  );
  return esiti;
}
