import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COPPIE, profiloDa } from '../src/selftest.js';
import { distanzaPercepita } from '../src/colorlab/confusion.js';
import { distanza } from '../src/colorlab/space.js';

describe('mini-test del profilo di visione', () => {
  it('le coppie diagnostiche collassano davvero alla severità dichiarata', () => {
    for (const c of COPPIE.filter((c) => c.asse)) {
      const profilo = c.asse === 'rosso-verde' ? 'deuteranomalia' : 'tritanomalia';
      const vista = distanzaPercepita(c.a, c.b, profilo, c.severita);
      const reale = distanza(c.a, c.b);
      assert.ok(vista < reale * 0.75, `${c.id}: reale ${reale.toFixed(1)} → vista ${vista.toFixed(1)}, crollo insufficiente`);
    }
  });

  it('la coppia di controllo non collassa su nessun profilo', () => {
    const c = COPPIE.find((c) => c.id === 'controllo');
    for (const p of ['deuteranomalia', 'protanomalia', 'tritanomalia']) {
      assert.ok(distanzaPercepita(c.a, c.b, p, 1) > 25, `il controllo collassa su ${p}`);
    }
  });

  it('nessuna coppia segnata significa nessun profilo', () => {
    assert.equal(profiloDa([]).profilo, null);
    assert.equal(profiloDa([]).severita, 0);
  });

  it('una coppia rosso-verde porta al profilo corrispondente', () => {
    assert.equal(profiloDa(['rg-forte']).profilo, 'deuteranomalia');
    assert.equal(profiloDa(['by']).profilo, 'tritanomalia');
  });

  it('confondere la coppia più difficile indica una forma più marcata', () => {
    assert.ok(profiloDa(['rg-fine']).severita > profiloDa(['rg-forte']).severita);
  });

  it('a parità di segnalazioni prevale l asse più diffuso', () => {
    assert.equal(profiloDa(['rg-forte', 'by']).profilo, 'deuteranomalia');
  });

  it('segnare il controllo avvisa senza bloccare', () => {
    const r = profiloDa(['rg-forte', 'controllo']);
    assert.equal(r.profilo, 'deuteranomalia');
    assert.ok(r.messaggio);
  });
});
