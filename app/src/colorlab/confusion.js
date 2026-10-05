import { distanza } from './space.js';
import { simula } from './simulate.js';

/**
 * Una coppia è confondibile quando valgono DUE condizioni insieme.
 *
 * 1. VICINANZA — i colori percepiti distano meno di VICINI.
 *    Riferimento: sotto 1 la differenza è invisibile, oltre 10 si coglie
 *    a colpo d'occhio. Gli swatch di un catalogo sono piccoli e non
 *    adiacenti, quindi la soglia utile è più alta di quella da laboratorio.
 *
 * 2. CROLLO — la distanza percepita è una frazione di quella reale.
 *    È questa la condizione che isola il problema vero. Due bianchi sporchi
 *    sono simili per chiunque: segnalarli non direbbe nulla sul daltonismo.
 *    Ci interessano le coppie che il profilo di visione AVVICINA, cioè
 *    colori che il venditore presenta come alternative distinte e che per
 *    questa persona diventano la stessa cosa.
 *
 * Entrambe calibrate contro app/tests/confusion.test.js, che contiene coppie
 * con verità misurata su fotografie reali. Quel test è la specifica.
 */
export const VICINI = 15;
export const CROLLO = 0.6;

/** Distanza fra due colori così come li vede il profilo indicato. */
export function distanzaPercepita(a, b, profilo, severita) {
  return distanza(simula(a, profilo, severita), simula(b, profilo, severita));
}

/**
 * Le coppie che collassano, dalla più critica.
 * Si confrontano sempre i colori SIMULATI: due tinte lontane nella realtà
 * possono essere identiche per la persona, ed è proprio il caso che cerchiamo.
 */
export function coppieConfondibili(varianti, profilo, severita) {
  const note = varianti.filter((v) => v.hex);
  const esiti = [];
  for (let i = 0; i < note.length; i++) {
    for (let j = i + 1; j < note.length; j++) {
      const a = note[i];
      const b = note[j];
      const percepita = distanzaPercepita(a.hex, b.hex, profilo, severita);
      const reale = distanza(a.hex, b.hex);
      if (percepita < VICINI && percepita < reale * CROLLO) {
        esiti.push({ a, b, reale, percepita });
      }
    }
  }
  return esiti.sort((x, y) => x.percepita - y.percepita);
}

/** Varianti con colore noto che non compaiono in nessuna coppia confondibile. */
export function distinguibili(varianti, coppie) {
  const coinvolte = new Set(coppie.flatMap((c) => [c.a.nome, c.b.nome]));
  return varianti.filter((v) => v.hex && !coinvolte.has(v.nome));
}

/** Varianti di cui la pagina non rivela il colore. */
export function senzaColore(varianti) {
  return varianti.filter((v) => !v.hex);
}
