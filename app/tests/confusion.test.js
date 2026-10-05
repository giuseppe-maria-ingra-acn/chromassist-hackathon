import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CROLLO, VICINI, coppieConfondibili, distanzaPercepita, distinguibili, senzaColore } from '../src/colorlab/confusion.js';
import { distanza } from '../src/colorlab/space.js';

const { varianti } = JSON.parse(readFileSync(new URL('../demo-page/measured.json', import.meta.url)));
const hex = (n) => varianti.find((v) => v.nome === n).hex;
const nomi = (coppie) => coppie.map((c) => [c.a.nome, c.b.nome].sort().join(' ⟷ '));

/**
 * Questo file è la SPECIFICA delle soglie, non un controllo a posteriori.
 * Le coppie hanno verità nota, misurata su fotografie di un catalogo reale.
 * Cambiando VICINI o CROLLO, questi casi devono continuare a passare.
 */
describe('rilevamento delle coppie confondibili', () => {
  it('segnala la coppia rosso-verde a pari luminosità', () => {
    // un rosso vinaccia e un verde-tortora: tinte opposte, stessa scurezza
    const trovate = nomi(coppieConfondibili(varianti, 'deuteranomalia', 0.8));
    assert.ok(trovate.includes('burgundy crush ⟷ new taupe green'), `trovate: ${trovate}`);
  });

  it('NON segnala colori che erano già simili di loro', () => {
    // due quasi-bianchi distano poco per chiunque: non è il daltonismo
    // ad avvicinarli, e segnalarli sarebbe rumore
    const a = hex('frost grey');
    const b = hex('white dune');
    const reale = distanza(a, b);
    const vista = distanzaPercepita(a, b, 'deuteranomalia', 0.8);
    assert.ok(vista > reale * CROLLO, 'nessun crollo: non deve essere segnalata');
    assert.ok(!nomi(coppieConfondibili(varianti, 'deuteranomalia', 0.8)).includes('frost grey ⟷ white dune'));
  });

  it('a severità 0 non collassa nulla', () => {
    assert.equal(coppieConfondibili(varianti, 'deuteranomalia', 0).length, 0);
  });

  it('la severità peggiora progressivamente la confusione', () => {
    const d = (s) => distanzaPercepita(hex('burgundy crush'), hex('new taupe green'), 'deuteranomalia', s);
    assert.ok(d(1) < d(0.8), 'a severità piena i colori devono essere più vicini');
    assert.ok(d(0.8) < d(0.4));
  });

  it('un asse diverso fa collassare una coppia diversa', () => {
    const deut = nomi(coppieConfondibili(varianti, 'deuteranomalia', 1));
    const trit = nomi(coppieConfondibili(varianti, 'tritanomalia', 1));
    assert.notDeepEqual(deut, trit, 'se coincidono non stiamo misurando il profilo');
  });

  it('ignora le varianti di cui la pagina non rivela il colore', () => {
    const conIgnoto = [...varianti, { nome: 'colore ignoto', hex: null }];
    const coppie = coppieConfondibili(conIgnoto, 'deuteranomalia', 1);
    assert.ok(coppie.every((c) => c.a.hex && c.b.hex));
    assert.deepEqual(senzaColore(conIgnoto).map((v) => v.nome), ['colore ignoto']);
  });

  it('ordina dalla coppia più critica', () => {
    const d = coppieConfondibili(varianti, 'deuteranomalia', 1).map((c) => c.percepita);
    assert.deepEqual(d, [...d].sort((a, b) => a - b));
  });

  it('le distinguibili sono tutte le altre con colore noto', () => {
    const coppie = coppieConfondibili(varianti, 'deuteranomalia', 1);
    const ok = distinguibili(varianti, coppie);
    const coinvolte = new Set(coppie.flatMap((c) => [c.a.nome, c.b.nome]));
    assert.ok(ok.every((v) => !coinvolte.has(v.nome)));
    assert.equal(ok.length + coinvolte.size, varianti.length);
  });

  it('le soglie restano nell intervallo sensato', () => {
    assert.ok(VICINI > 10 && VICINI < 25);
    assert.ok(CROLLO > 0 && CROLLO < 1);
  });
});
