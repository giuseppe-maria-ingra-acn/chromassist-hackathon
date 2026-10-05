#!/usr/bin/env node
/**
 * Assembla l'overlay in un unico file autonomo, da incollare nella console
 * di una pagina di catalogo.
 *
 * Perché un assemblatore invece di riscrivere la matematica nello script:
 * un'estensione del browser deve portarsi dietro il proprio codice — non può
 * importarlo da un server di sviluppo, che su una macchina qualunque non
 * esiste. Ma riscrivere a mano matrici e formule significherebbe due copie
 * che divergono alla prima correzione. Qui il codice resta uno: i moduli
 * veri, quelli coperti dai test, vengono concatenati togliendo import ed
 * export, che in un file da incollare non servono.
 *
 *   node experiments/assembla.mjs
 *   → experiments/live-overlay.bundle.js
 */
import { readFileSync, writeFileSync } from 'node:fs';

const radice = new URL('../', import.meta.url);
const leggi = (p) => readFileSync(new URL(p, radice), 'utf8');

/** Ordine di dipendenza: space non dipende da nulla, confusion dipende da simulate. */
const MODULI = [
  'app/src/colorlab/space.js',
  'app/src/colorlab/simulate.js',
  'app/src/colorlab/confusion.js',
  'app/src/describe.js',
  'app/src/selftest.js'
];

/**
 * Toglie import ed export mantenendo le dichiarazioni.
 * I moduli condividono un unico ambito nel file assemblato, quindi i nomi
 * esportati diventano semplici variabili locali.
 */
function spoglia(sorgente, percorso) {
  const pulito = sorgente
    .replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s+(?=(const|function|class|let))/gm, '')
    .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '');
  return `/* ===== ${percorso} ===== */\n${pulito.trim()}\n`;
}

const nucleo = MODULI.map((p) => spoglia(leggi(p), p)).join('\n');

/** La parte di interfaccia, che vive solo in questo esperimento. */
const interfaccia = leggi('experiments/overlay-ui.js');

const intestazione = `/**
 * ChromAssist — overlay per pagine di catalogo reali.  FILE GENERATO.
 *
 * Non modificare questo file: si rigenera con
 *     node experiments/assembla.mjs
 * Le modifiche vanno nei moduli in app/src/ o in experiments/overlay-ui.js.
 *
 * USO: apri una scheda prodotto e incolla l'intero file nella console
 * degli strumenti sviluppatore.
 *
 * Generato il ${new Date().toISOString().slice(0, 16).replace('T', ' ')}
 */
(() => {
`;

const chiusura = `
})();
`;

/**
 * Converte ogni carattere non ASCII in una sequenza \uXXXX.
 *
 * Il file è destinato a essere incollato nella console di un browser, e quel
 * percorso non garantisce la codifica: Chrome ha interpretato l'UTF-8 come
 * MacRoman, trasformando "più" in "pi√π" e "difficoltà" in "difficolt√†".
 * Un file di soli caratteri ASCII è immune: le sequenze di escape sono
 * interpretate da JavaScript, non dal decodificatore di testo.
 *
 * I sorgenti restano in UTF-8 leggibile; solo l'assemblato è convertito.
 */
function soloAscii(testo) {
  return testo.replace(/[^\x00-\x7F]/g, (c) =>
    '\\u' + c.codePointAt(0).toString(16).padStart(4, '0')
  );
}

const uscita = soloAscii(intestazione + nucleo + '\n' + interfaccia + chiusura);
writeFileSync(new URL('experiments/live-overlay.bundle.js', radice), uscita);

const righe = uscita.split('\n').length;
console.log(`live-overlay.bundle.js  ${righe} righe, ${(uscita.length / 1024).toFixed(1)} kB`);
console.log(`moduli inclusi: ${MODULI.length} + interfaccia`);
