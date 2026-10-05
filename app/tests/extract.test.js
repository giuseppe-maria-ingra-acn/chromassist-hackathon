import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse as titleSuffix } from '../src/extract/titleSuffix.js';
import { parse as jsonLd } from '../src/extract/jsonLd.js';
import { parse as domSwatch } from '../src/extract/domSwatch.js';
import { estrai } from '../src/extract/index.js';

/**
 * DOM minimo: abbastanza per esercitare i parser senza un browser
 * né dipendenze esterne. Se un parser richiede più di questo, sta
 * facendo troppo.
 */
function fakeDoc({ titolo = null, swatch = [], ld = null } = {}) {
  const nodi = swatch.map((s) => ({
    getAttribute: (k) => (k === 'data-variant' ? s.nome : k === 'data-colour-hex' ? s.dataHex ?? null : k === 'data-image' ? s.img ?? null : null),
    style: { backgroundColor: s.inline ?? '' },
    querySelector: () => null
  }));
  return {
    querySelector: (sel) => (sel === '[data-product-title]' && titolo ? { textContent: titolo } : null),
    querySelectorAll: (sel) => {
      if (sel === '[data-variant]') return nodi;
      if (sel.startsWith('script')) return ld ? [{ textContent: JSON.stringify(ld) }] : [];
      return [];
    }
  };
}

describe('estrazione del nome colore dal titolo', () => {
  it('prende l ultimo segmento dopo l ultimo separatore', () => {
    const r = titleSuffix(fakeDoc({ titolo: 'W QUEST JACKET - Giacca hard shell - burgundy crush' }));
    assert.deepEqual(r, [{ nome: 'burgundy crush', hex: null, imageUrl: null }]);
  });

  it('non inventa un colore: hex resta null', () => {
    const r = titleSuffix(fakeDoc({ titolo: 'MODELLO - Categoria - rosso fuoco' }));
    assert.equal(r[0].hex, null, 'il nome non deve diventare un colore');
  });

  it('su un titolo senza separatore non restituisce nulla', () => {
    assert.deepEqual(titleSuffix(fakeDoc({ titolo: 'SOLO NOME' })), []);
    assert.deepEqual(titleSuffix(fakeDoc({})), []);
  });
});

describe('estrazione dai dati strutturati', () => {
  it('legge i nomi dalle varianti schema.org', () => {
    const r = jsonLd(fakeDoc({ ld: { hasVariant: [{ color: 'pear' }, { color: 'tnf black' }] } }));
    assert.deepEqual(r.map((v) => v.nome), ['pear', 'tnf black']);
  });

  it('il campo color è una stringa commerciale, non un colore', () => {
    const r = jsonLd(fakeDoc({ ld: { hasVariant: [{ color: 'new taupe green' }] } }));
    assert.equal(r[0].hex, null);
  });

  it('un JSON malformato non fa fallire la lettura', () => {
    const doc = fakeDoc({});
    doc.querySelectorAll = (s) => (s.startsWith('script') ? [{ textContent: '{rotto' }] : []);
    assert.deepEqual(jsonLd(doc), []);
  });
});

describe('estrazione dagli swatch nel DOM', () => {
  it('legge l esadecimale da un attributo dati senza cancelletto', () => {
    const r = domSwatch(fakeDoc({ swatch: [{ nome: 'garnet', dataHex: 'AB8877' }] }));
    assert.equal(r[0].hex, '#AB8877');
  });

  it('legge l esadecimale da uno stile inline', () => {
    const r = domSwatch(fakeDoc({ swatch: [{ nome: 'tnf black', inline: 'rgb(41, 37, 38)' }] }));
    assert.equal(r[0].hex, '#292526');
  });

  it('senza colore nel markup lascia hex a null e conserva l immagine', () => {
    const r = domSwatch(fakeDoc({ swatch: [{ nome: 'burgundy crush', img: 'img/burgundy-crush.svg' }] }));
    assert.equal(r[0].hex, null);
    assert.equal(r[0].imageUrl, 'img/burgundy-crush.svg');
  });

  it('scarta un attributo dati non valido invece di accettarlo', () => {
    const r = domSwatch(fakeDoc({ swatch: [{ nome: 'x', dataHex: 'non-un-colore' }] }));
    assert.equal(r[0].hex, null);
  });
});

describe('unione dei parser', () => {
  it('conserva i nomi e completa i colori da fonti diverse', () => {
    const doc = fakeDoc({
      titolo: 'MODELLO - Categoria - burgundy crush',
      swatch: [{ nome: 'burgundy crush', img: 'img/bc.svg' }, { nome: 'garnet', dataHex: 'AB8877' }],
      ld: { hasVariant: [{ color: 'burgundy crush' }, { color: 'garnet' }, { color: 'pear' }] }
    });
    const { varianti, fonti } = estrai(doc);
    const nomi = varianti.map((v) => v.nome).sort();
    assert.deepEqual(nomi, ['burgundy crush', 'garnet', 'pear']);
    assert.equal(varianti.find((v) => v.nome === 'garnet').hex, '#AB8877');
    assert.equal(varianti.find((v) => v.nome === 'burgundy crush').hex, null);
    assert.ok(fonti.length >= 2, 'devono risultare più fonti concorrenti');
  });

  it('un parser che non si applica non blocca gli altri', () => {
    const doc = fakeDoc({ swatch: [{ nome: 'garnet', dataHex: 'AB8877' }] });
    doc.querySelectorAll = ((orig) => (sel) => {
      if (sel.startsWith('script')) throw new Error('simulazione di guasto');
      return orig(sel);
    })(doc.querySelectorAll);
    const { varianti } = estrai(doc);
    assert.equal(varianti.length, 1);
  });
});
