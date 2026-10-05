/**
 * Mini-test per ricavare il profilo di visione.
 *
 * Nessun menu con termini medici: moltissime persone sanno di confondere
 * certi colori senza conoscere il nome della propria condizione. Si chiede
 * una cosa che chiunque sa rispondere — quali coppie sembrano uguali — e si
 * deduce il resto.
 *
 * Ogni coppia è diagnostica per un asse e per un grado. Le soglie sono
 * verificate in app/tests/selftest.test.js con la matematica della simulazione.
 */
export const COPPIE = [
  { id: 'rg-forte', asse: 'rosso-verde', severita: 0.6, a: '#C0392B', b: '#6B8E23',
    nota: 'rosso mattone e verde oliva' },
  { id: 'rg-fine', asse: 'rosso-verde', severita: 1.0, a: '#9A2645', b: '#6B6454',
    nota: 'rosso vinaccia e verde tortora' },
  { id: 'by', asse: 'blu-giallo', severita: 0.9, a: '#2E9B8F', b: '#5BA4D8',
    nota: 'verde acqua e azzurro' },
  { id: 'controllo', asse: null, severita: 0, a: '#1F2A44', b: '#E2DDA5',
    nota: 'blu navy e giallo chiaro — nessuno dovrebbe confonderli' }
];

const PER_ASSE = { 'rosso-verde': 'deuteranomalia', 'blu-giallo': 'tritanomalia' };

/**
 * Dalle coppie segnate come "uguali" ricava profilo e severità.
 * @param {string[]} segnate  id delle coppie indicate come indistinguibili
 */
export function profiloDa(segnate) {
  const scelte = COPPIE.filter((c) => segnate.includes(c.id) && c.asse);
  if (!scelte.length) {
    return { profilo: null, severita: 0, messaggio: 'Nessuna coppia confusa: la tua visione dei colori distingue tutte le combinazioni del test.' };
  }

  // l'asse con più segnalazioni vince; a parità prevale il rosso-verde,
  // di gran lunga più diffuso
  const conteggio = {};
  for (const c of scelte) conteggio[c.asse] = (conteggio[c.asse] ?? 0) + 1;
  const asse = Object.keys(conteggio).sort((x, y) =>
    conteggio[y] - conteggio[x] || (x === 'rosso-verde' ? -1 : 1))[0];

  // la severità è quella della coppia più difficile fra le segnalate:
  // confondere una coppia molto contrastata indica una forma più marcata
  const severita = Math.max(...scelte.filter((c) => c.asse === asse).map((c) => c.severita));

  const incoerente = segnate.includes('controllo');
  return {
    profilo: PER_ASSE[asse],
    severita,
    asse,
    messaggio: incoerente
      ? 'Hai segnato anche la coppia di controllo, che di norma si distingue: il risultato è indicativo e puoi correggerlo con il cursore.'
      : null
  };
}
