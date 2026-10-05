import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILI, simula } from '../src/colorlab/simulate.js';
import { distanza, hexToRgb, rgbToHex, rgbToLab, deltaE2000 } from '../src/colorlab/space.js';

const canale = (hex) => hexToRgb(hex);
const spread = (hex) => { const c = canale(hex); return Math.max(...c) - Math.min(...c); };

describe('spazio colore e distanza percettiva', () => {
  it('ΔE2000 fra bianco e nero vale esattamente 100', () => {
    // valore canonico di riferimento per CIEDE2000: se l'implementazione
    // è corretta cade su 100 preciso, non "circa"
    assert.equal(Number(distanza('#FFFFFF', '#000000').toFixed(2)), 100.00);
  });

  it('ΔE2000 fra un colore e se stesso è zero', () => {
    for (const c of ['#9A2645', '#6B6454', '#143775', '#E2DDA5']) {
      assert.equal(distanza(c, c), 0);
    }
  });

  it('la distanza è simmetrica', () => {
    const d1 = distanza('#9A2645', '#6B6454');
    const d2 = distanza('#6B6454', '#9A2645');
    assert.ok(Math.abs(d1 - d2) < 1e-9);
  });

  it('esadecimale e RGB fanno il giro completo senza perdite', () => {
    for (const c of ['#000000', '#FFFFFF', '#9A2645', '#1F2A44']) {
      assert.equal(rgbToHex(hexToRgb(c)), c.toUpperCase());
    }
    assert.equal(rgbToHex(hexToRgb('#abc')), '#AABBCC');
  });

  it('rifiuta valori non interpretabili', () => {
    assert.throws(() => hexToRgb('non-un-colore'));
    assert.throws(() => hexToRgb('#12345'));
  });

  it('Lab del bianco è L=100 con componenti cromatiche nulle', () => {
    const [L, a, b] = rgbToLab([255, 255, 255]);
    assert.ok(Math.abs(L - 100) < 0.01);
    assert.ok(Math.abs(a) < 0.01 && Math.abs(b) < 0.01);
  });
});

describe('simulazione CVD', () => {
  it('con severità 0 il colore resta identico', () => {
    for (const p of PROFILI) {
      assert.equal(simula('#9A2645', p, 0), '#9A2645');
    }
  });

  it('gli acromatici restano acromatici su ogni profilo', () => {
    // un grigio non ha componente cromatica da perdere: se la simulazione
    // lo colora, la matrice è applicata male
    for (const p of PROFILI) {
      for (const g of ['#000000', '#808080', '#FFFFFF']) {
        assert.ok(spread(simula(g, p, 1)) <= 6, `${p} ha colorato ${g}`);
      }
    }
  });

  it('la severità è un continuo, non un interruttore', () => {
    const passi = [0.2, 0.4, 0.6, 0.8, 1].map((s) => simula('#9A2645', 'deuteranomalia', s));
    assert.equal(new Set(passi).size, 5, 'ogni passo deve produrre un valore diverso');
  });

  it('più severità significa più distanza dal colore di partenza', () => {
    const d = (s) => distanza('#9A2645', simula('#9A2645', 'deuteranomalia', s));
    assert.ok(d(0.3) < d(0.6));
    assert.ok(d(0.6) < d(1));
  });

  it('sull asse rosso-verde il blu puro è il meno alterato', () => {
    // il cono del blu è intatto nelle deficienze rosso-verde:
    // è una proprietà fisiologica, non un dettaglio implementativo
    const blu = distanza('#0000FF', simula('#0000FF', 'deuteranomalia', 1));
    const rosso = distanza('#FF0000', simula('#FF0000', 'deuteranomalia', 1));
    const verde = distanza('#00FF00', simula('#00FF00', 'deuteranomalia', 1));
    assert.ok(blu < rosso && blu < verde, `blu ${blu.toFixed(1)} rosso ${rosso.toFixed(1)} verde ${verde.toFixed(1)}`);
  });

  it('rifiuta profili e severità non validi', () => {
    assert.throws(() => simula('#000000', 'inesistente', 1));
    assert.throws(() => simula('#000000', 'deuteranomalia', 1.5));
    assert.throws(() => simula('#000000', 'deuteranomalia', -0.1));
  });
});
