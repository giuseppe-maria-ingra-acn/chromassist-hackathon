import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nomeColore, nomeConCautela } from '../src/describe.js';
import { simula } from '../src/colorlab/simulate.js';

describe('nome del colore in parole', () => {
  it('riconosce i colori primari con il nome atteso', () => {
    assert.equal(nomeColore('#C62828').nome, 'rosso');
    assert.equal(nomeColore('#1F4FA0').nome, 'blu');
    assert.equal(nomeColore('#2E7D32').nome, 'verde');
    assert.equal(nomeColore('#111111').nome, 'nero');
  });

  it('riconosce i colori delle varianti misurate', () => {
    // sono i casi reali su cui lo strumento deve essere credibile
    assert.equal(nomeColore('#9A2645').nome, 'rosso vinaccia');
    assert.equal(nomeColore('#6B6454').nome, 'verde tortora');
    assert.equal(nomeColore('#1F2A44').nome, 'blu navy');
  });

  it('è deterministico: stesso colore, stesso nome', () => {
    for (let i = 0; i < 5; i++) {
      assert.equal(nomeColore('#6B6454').nome, 'verde tortora');
    }
  });

  it('un colore esattamente sul riferimento ha scostamento nullo', () => {
    const r = nomeColore('#808080');
    assert.equal(r.nome, 'grigio');
    assert.ok(r.scostamento < 0.01);
  });

  it('segnala la cautela quando il colore sta fra due riferimenti', () => {
    const vicino = nomeConCautela('#808080');
    assert.ok(!vicino.startsWith('tendente') && !vicino.startsWith('vicino'));
    // un colore molto saturo e inusuale deve risultare più incerto
    const incerto = nomeConCautela('#7FFF00');
    assert.ok(/^(tendente al|vicino al)/.test(incerto), `atteso un nome cauto, ottenuto "${incerto}"`);
  });

  it('il colore percepito riceve un nome diverso da quello reale', () => {
    // è il cuore del messaggio all'utente: "si chiama X, tu vedrai Y"
    const reale = nomeColore('#9A2645').nome;
    const percepito = nomeColore(simula('#9A2645', 'deuteranomalia', 1)).nome;
    assert.notEqual(reale, percepito);
  });

  it('rifiuta un colore non interpretabile invece di restituire un nome', () => {
    assert.throws(() => nomeColore('non-un-colore'));
  });
});
