#!/usr/bin/env node
/**
 * Assegna un punteggio all'output di `encoding-scout` su un caso dell'eval.
 *
 * L'agente va eseguito a mano — è un sub-agente, non una funzione — ma la
 * valutazione no: se fosse a sensazione il confronto fra due modelli non
 * varrebbe nulla. Qui i quattro criteri sono binari e verificabili.
 *
 *   node tools/valuta-eval.mjs <caso> <file-con-output>
 *   encoding-scout ... | node tools/valuta-eval.mjs pdp-varianti.html -
 *
 * Esce con codice 1 se un criterio non è soddisfatto.
 */
import { readFileSync } from 'node:fs';

const [caso, origine] = process.argv.slice(2);
if (!caso || !origine) {
  console.error('Uso: node tools/valuta-eval.mjs <caso.html> <file-output | ->');
  console.error('Casi disponibili: pdp-varianti.html, listing.html, con-hex.html');
  process.exit(2);
}

const base = new URL('../agents/evals/cases/', import.meta.url);
const { casi } = JSON.parse(readFileSync(new URL('attese.json', base)));
const atteso = casi.find((c) => c.file === caso);
if (!atteso) {
  console.error(`Caso sconosciuto: "${caso}". Disponibili: ${casi.map((c) => c.file).join(', ')}`);
  process.exit(2);
}

const output = origine === '-' ? readFileSync(0, 'utf8') : readFileSync(origine, 'utf8');
const testo = output.toLowerCase();

/**
 * I quattro criteri dell'eval.
 *
 * Il secondo è quello che discrimina davvero: dichiarare l'ASSENZA di un
 * esadecimale è più difficile che estrarne uno presente, perché un modello
 * più debole tende a riempire il vuoto con un valore plausibile. Ed è anche
 * il fallimento peggiore, perché produce un'analisi sbagliata che sembra
 * completa.
 */
const criteri = [
  {
    id: 1,
    nome: 'individua la fonte del nome colore',
    verifica: () => atteso.nomeColore.fonte.some((f) => testo.includes(f.toLowerCase()))
  },
  {
    id: 2,
    nome: atteso.esadecimale.presente
      ? 'riconosce che l’esadecimale è presente'
      : 'dichiara che l’esadecimale NON esiste',
    discriminante: true,
    verifica: () => {
      const diceNo = /presente:\s*(no|assente|false)/.test(testo);
      const diceSi = /presente:\s*(s[ìi]|yes|true)/.test(testo);
      if (atteso.esadecimale.presente) return diceSi && !diceNo;
      // non basta dire "no": non deve nemmeno aver riportato un esadecimale
      const haInventato = /#[0-9a-f]{6}/.test(testo);
      return diceNo && !diceSi && !haInventato;
    }
  },
  {
    id: 3,
    nome: 'individua l’immagine e la sua origine',
    verifica: () => {
      const parlaDiImmagine = /immagine|img/.test(testo);
      const origineAttesa = atteso.immagine.origineDiversa
        ? /diversa|esterna|altro dominio|cdn/.test(testo)
        : /stessa|same|relativa|locale/.test(testo);
      return parlaDiImmagine && origineAttesa;
    }
  },
  {
    id: 4,
    nome: 'rispetta il formato di output richiesto',
    verifica: () => ['sito', 'nome colore', 'esadecimale', 'immagine'].every((s) => testo.includes(s))
  }
];

console.log(`Caso: ${caso}\n`);

let falliti = 0;
for (const c of criteri) {
  const ok = c.verifica();
  if (!ok) falliti++;
  const segno = ok ? 'OK  ' : 'NO  ';
  const nota = c.discriminante ? '  ← criterio discriminante' : '';
  console.log(`  ${segno}${c.id}. ${c.nome}${nota}`);
}

const mancanti = atteso.nomiAttesi.filter((n) => !testo.includes(n.toLowerCase()));
console.log();
if (mancanti.length) {
  console.log(`Nomi variante non riportati: ${mancanti.join(', ')}`);
} else {
  console.log(`Tutti i nomi variante riportati (${atteso.nomiAttesi.length}).`);
}

console.log(`\nEsito: ${criteri.length - falliti}/${criteri.length} criteri soddisfatti.`);
process.exit(falliti ? 1 : 0);
