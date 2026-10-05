import { hexToRgb, linearToSrgb, rgbToHex, srgbToLinear } from './space.js';

/**
 * Matrici di trasformazione di Machado, Oliveira & Fernandes (2009),
 * "A Physiologically-based Model for Simulation of Color Vision Deficiency",
 * IEEE Transactions on Visualization and Computer Graphics.
 *
 * Valori per severità 1.0, come pubblicati dagli autori. Si applicano in
 * RGB LINEARE: applicarle in sRGB produce risultati plausibili ma sbagliati.
 */
const MATRICI = {
  deuteranomalia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881]
  ],
  protanomalia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  tritanomalia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900]
  ]
};

const IDENTITA = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

export const PROFILI = Object.keys(MATRICI);

export const ETICHETTE = {
  deuteranomalia: { breve: 'rosso-verde', nota: 'la forma più diffusa — circa un uomo su dodici' },
  protanomalia: { breve: 'rosso-verde, rossi più scuri', nota: 'meno diffusa, i rossi perdono anche luminosità' },
  tritanomalia: { breve: 'blu-giallo', nota: 'molto rara' }
};

/**
 * Interpolazione fra identità e matrice piena.
 *
 * Nota sul metodo: Machado pubblica matrici distinte per ogni grado di
 * severità. Qui si interpola linearmente fra visione normale e forma
 * completa. A severità 1 il risultato è esatto; ai valori intermedi è
 * un'approssimazione che conserva l'andamento progressivo del collasso.
 * Per lo scopo dello strumento — stabilire SE due colori si confondono —
 * è adeguata, e il caso che conta per l'accessibilità (severità alta) è esatto.
 */
function matrice(profilo, severita) {
  const M = MATRICI[profilo];
  if (!M) throw new Error(`Profilo sconosciuto: ${profilo}`);
  if (!(severita >= 0 && severita <= 1)) throw new Error(`Severità fuori intervallo: ${severita}`);
  return M.map((riga, i) => riga.map((v, j) => IDENTITA[i][j] + (v - IDENTITA[i][j]) * severita));
}

/**
 * Come appare un colore a chi ha la deficienza indicata.
 * @param {string} hex
 * @param {'deuteranomalia'|'protanomalia'|'tritanomalia'} profilo
 * @param {number} severita 0 = visione normale, 1 = forma completa
 */
export function simula(hex, profilo, severita = 1) {
  const M = matrice(profilo, severita);
  const lin = hexToRgb(hex).map(srgbToLinear);
  return rgbToHex(M.map((riga) => linearToSrgb(Math.max(0, Math.min(1, riga[0] * lin[0] + riga[1] * lin[1] + riga[2] * lin[2])))));
}
