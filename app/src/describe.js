import { distanza } from './colorlab/space.js';

/**
 * Nomi di colore di riferimento, in italiano comune.
 * Servono a dire a parole che tinta è un esadecimale: si cerca il nome più
 * vicino per distanza percettiva. La frase non è generata, è calcolata —
 * stesso colore, stesso nome, sempre.
 */
const RIFERIMENTI = [
  ['nero', '#111111'], ['grigio scuro', '#4A4A4A'], ['grigio', '#808080'],
  ['grigio chiaro', '#C8C8C8'], ['bianco', '#F7F7F5'], ['avorio', '#EDE8D8'],
  ['beige', '#D8C9A8'], ['sabbia', '#C2B280'], ['marrone', '#6B4A2F'],
  ['marrone chiaro', '#9C7A58'], ['tortora', '#8B8178'], ['marrone grigio', '#6E6459'],
  ['ruggine', '#B7410E'], ['terracotta', '#C16B4A'], ['arancione', '#E8731A'],
  ['giallo senape', '#C9A227'], ['giallo', '#EFD23A'], ['giallo verdino', '#D9DC8A'],
  ['verde oliva', '#6B6B3A'], ['verde tortora', '#6B6454'], ['verde militare', '#4B5320'],
  ['verde', '#2E7D32'], ['verde chiaro', '#7CB97F'], ['verde bosco', '#1E3F23'],
  ['verde acqua', '#2E9B8F'], ['turchese', '#30B5B0'], ['azzurro', '#5BA4D8'],
  ['blu', '#1F4FA0'], ['blu navy', '#1F2A44'], ['blu polvere', '#AEBDD4'],
  ['viola', '#6A3F9E'], ['lilla', '#B79BD4'], ['magenta', '#B4357F'],
  ['rosa', '#E79BB4'], ['rosa antico', '#C98A94'], ['rosso', '#C62828'],
  ['rosso vinaccia', '#8E2440'], ['bordeaux', '#6B1F2E'], ['prugna', '#5B2A42']
];

/** Il nome di riferimento più vicino, con la sua distanza percettiva. */
export function nomeColore(hex) {
  let migliore = null;
  let minima = Infinity;
  for (const [nome, rif] of RIFERIMENTI) {
    const d = distanza(hex, rif);
    if (d < minima) { minima = d; migliore = nome; }
  }
  return { nome: migliore, scostamento: minima };
}

/**
 * Quanto è affidabile il nome trovato. Oltre una certa distanza il colore
 * sta fra due riferimenti e il nome va presentato con cautela.
 */
export function nomeConCautela(hex) {
  const { nome, scostamento } = nomeColore(hex);
  if (scostamento < 8) return nome;
  if (scostamento < 18) return `tendente al ${nome}`;
  return `vicino al ${nome}`;
}
