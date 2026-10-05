#!/usr/bin/env node
/**
 * Verifica se una palette resta leggibile a chi ha una deficienza della
 * visione dei colori.
 *
 * È il caso d'uso inverso dell'applicazione: invece di aiutare chi compra a
 * districarsi fra colori mal etichettati, aiuta chi progetta a non creare il
 * problema. Stessa matematica, altro capo del processo.
 *
 *   node tools/verifica-palette.mjs "#2E7D32" "#C62828" "#1F4FA0"
 *   node tools/verifica-palette.mjs --file palette.json --severita 0.6
 *
 * Con --file si passa un JSON { "nome colore": "#RRGGBB", ... }: le etichette
 * rendono il rapporto leggibile quando i colori sono molti.
 *
 * Esce con codice 1 se la deficienza rende indistinguibili delle coppie:
 * utilizzabile in una pipeline per impedire che una palette inaccessibile
 * arrivi in produzione.
 */
import { readFileSync } from 'node:fs';
import { distanza } from '../app/src/colorlab/space.js';
import { PROFILI, simula } from '../app/src/colorlab/simulate.js';

/**
 * Soglia di vicinanza, più prudente di quella usata sugli swatch di un
 * catalogo: un colore di sistema distingue stati — attivo, errore,
 * disponibile — su elementi piccoli e lontani fra loro, dove il confronto
 * diretto non è possibile.
 */
const VICINI = 13;

/**
 * Perché il verdetto è doppio.
 *
 * Due colori vicini fra loro non sono automaticamente un problema di
 * accessibilità: possono essere gradini adiacenti di una scala, vicini per
 * chiunque e per scelta. Confonderli con il caso vero — colori che il profilo
 * di visione AVVICINA — produrrebbe allarmi su cui nessuno può agire.
 *
 *   causato       la distanza crolla: è la deficienza a creare il problema
 *   preesistente  la distanza non cambia: è una scelta di design, uguale per tutti
 */
const CROLLO = 0.7;

/* ---------- argomenti ---------- */

const argv = process.argv.slice(2);
const opzione = (nome) => {
  const i = argv.indexOf(`--${nome}`);
  return i > -1 ? argv[i + 1] : undefined;
};

const severita = Number(opzione('severita') ?? 1);
if (!(severita >= 0 && severita <= 1)) {
  console.error(`Severità fuori intervallo: ${opzione('severita')}. Attesa fra 0 e 1.`);
  process.exit(2);
}

let nome, colori;
const file = opzione('file');
if (file) {
  try {
    colori = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Non riesco a leggere "${file}": ${e.message}`);
    process.exit(2);
  }
  const invalidi = Object.entries(colori).filter(([, v]) => !/^#[0-9a-fA-F]{6}$/.test(String(v)));
  if (invalidi.length) {
    console.error(`Valori non interpretabili: ${invalidi.map(([k]) => k).join(', ')}`);
    process.exit(2);
  }
  nome = file;
} else {
  const hex = argv.filter((a) => /^#?[0-9a-fA-F]{6}$/.test(a)).map((h) => (h.startsWith('#') ? h : `#${h}`));
  if (hex.length < 2) {
    console.error('Servono almeno due colori. Esempi:');
    console.error('  node tools/verifica-palette.mjs "#2E7D32" "#C62828"');
    console.error('  node tools/verifica-palette.mjs --file palette.json');
    process.exit(2);
  }
  nome = 'palette fornita';
  colori = Object.fromEntries(hex.map((h) => [h, h]));
}

/* ---------- analisi ---------- */

const etichette = Object.keys(colori);
console.log(`${nome} — ${etichette.length} colori, severità ${severita}\n`);

let resiIndistinguibili = 0;
const preesistenti = new Set();

for (const profilo of PROFILI) {
  const causati = [];

  for (let i = 0; i < etichette.length; i++) {
    for (let j = i + 1; j < etichette.length; j++) {
      const a = etichette[i];
      const b = etichette[j];
      const reale = distanza(colori[a], colori[b]);
      const vista = distanza(simula(colori[a], profilo, severita), simula(colori[b], profilo, severita));
      if (vista >= VICINI) continue;
      if (vista < reale * CROLLO) causati.push({ a, b, reale, vista });
      else preesistenti.add(`${a} ⟷ ${b} (${reale.toFixed(0)})`);
    }
  }

  causati.sort((x, y) => x.vista - y.vista);
  if (!causati.length) {
    console.log(`  ${profilo.padEnd(16)} nessuna coppia resa indistinguibile`);
  } else {
    resiIndistinguibili += causati.length;
    console.log(`  ${profilo.padEnd(16)} ${causati.length} coppie rese indistinguibili`);
    for (const r of causati) {
      console.log(`      ${r.a} ⟷ ${r.b}   distanza ${r.reale.toFixed(0)} reale → ${r.vista.toFixed(1)} percepita`);
    }
  }
}

console.log();

if (preesistenti.size) {
  console.log(`Già vicini di loro, a prescindere dalla visione: ${[...preesistenti].join(', ')}.`);
  console.log('Non è un problema di accessibilità — se sono gradini di una scala è voluto —');
  console.log('ma non affidare a quella differenza un\'informazione importante.\n');
}

if (!resiIndistinguibili) {
  // Spiegare PERCHÉ una palette passa è l'informazione che serve a chi deve
  // estenderla senza romperla.
  const scala = etichette.map((e) => luminosita(colori[e])).sort((x, y) => x - y);
  const passo = scala.length > 1 ? (scala.at(-1) - scala[0]) / (scala.length - 1) : 0;
  console.log('Nessuna coppia resa indistinguibile dalla deficienza.');
  console.log(`Motivo: i colori coprono una scala di luminosità ampia (${scala[0].toFixed(0)} → ${scala.at(-1).toFixed(0)}, passo medio ${passo.toFixed(0)}).`);
  console.log('Quando la tinta collassa la luminosità resta, ed è lei a tenerli distinguibili.');
  console.log('\nPer estendere la palette senza romperla: non introdurre un colore');
  console.log('alla stessa luminosità di uno già presente.');
  process.exit(0);
}

console.log(`${resiIndistinguibili} coppie rese indistinguibili dalla deficienza.`);
console.log('Rimedio: differenzia la luminosità, oppure non affidare al solo colore');
console.log('la distinzione fra questi elementi (WCAG 2.x, criterio 1.4.1).');
process.exit(1);

/** Luminosità percettiva L* di CIELAB: è lei a reggere quando la tinta collassa. */
function luminosita(hex) {
  const n = parseInt(hex.slice(1), 16);
  const canali = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = canali.map(lin);
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
}
