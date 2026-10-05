#!/usr/bin/env node
/**
 * Calcola quali colori diventano indistinguibili per un dato profilo di visione.
 *
 * Invocato dal comando /verify-confusion, che ne inietta l'output nel proprio
 * corpo. Il comando non descrive il calcolo: lo esegue.
 *
 *   node app/scripts/confusion.mjs <profilo> <severità> [hex...]
 *
 * Senza esadecimali usa le varianti di riferimento in demo-page/measured.json.
 */
import { readFileSync } from 'node:fs';
import { coppieConfondibili, distinguibili } from '../src/colorlab/confusion.js';
import { PROFILI, simula } from '../src/colorlab/simulate.js';
import { nomeConCautela } from '../src/describe.js';

const [profilo = 'deuteranomalia', sevRaw = '0.8', ...hex] = process.argv.slice(2);
const severita = Number(sevRaw);

if (!PROFILI.includes(profilo)) {
  console.error(`Profilo sconosciuto: "${profilo}". Validi: ${PROFILI.join(', ')}`);
  process.exit(1);
}
if (!(severita >= 0 && severita <= 1)) {
  console.error(`Severità fuori intervallo: "${sevRaw}". Attesa fra 0 e 1.`);
  process.exit(1);
}

let varianti;
if (hex.length) {
  varianti = hex.map((h) => ({ nome: h, hex: h.startsWith('#') ? h : `#${h}` }));
} else {
  const rif = JSON.parse(readFileSync(new URL('../demo-page/measured.json', import.meta.url)));
  varianti = rif.varianti;
  console.log(`Riferimento: ${rif.prodotto}`);
}

console.log(`Profilo: ${profilo} · severità ${severita}\n`);

const coppie = coppieConfondibili(varianti, profilo, severita);

if (!coppie.length) {
  console.log('Nessuna coppia diventa indistinguibile con questo profilo.');
} else {
  console.log(`Coppie che collassano: ${coppie.length}\n`);
  for (const c of coppie) {
    const percepitoA = simula(c.a.hex, profilo, severita);
    console.log(`  "${c.a.nome}" (${nomeConCautela(c.a.hex)})`);
    console.log(`  "${c.b.nome}" (${nomeConCautela(c.b.hex)})`);
    console.log(`     entrambi percepiti come ${nomeConCautela(percepitoA)}`);
    console.log(`     distanza: ${c.reale.toFixed(1)} reale → ${c.percepita.toFixed(1)} percepita\n`);
  }
}

const ok = distinguibili(varianti, coppie);
if (ok.length) console.log(`Restano distinguibili: ${ok.map((v) => v.nome).join(' · ')}`);
