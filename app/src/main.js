import { COPPIE, profiloDa } from './selftest.js';
import { ETICHETTE, simula } from './colorlab/simulate.js';
import { coppieConfondibili, distinguibili, senzaColore } from './colorlab/confusion.js';
import { completaDaImmagini, estrai } from './extract/index.js';
import { nomeConCautela, nomeColore } from './describe.js';

const el = (id) => document.getElementById(id);
const stato = { varianti: [], fonti: [], profilo: null, severita: 0, segnate: new Set(), selezionata: null };

/* ---------- lettura della pagina prodotto ---------- */

async function leggiScheda() {
  const doc = el('sito').contentDocument;
  const { varianti, fonti } = estrai(doc);
  stato.fonti = fonti;

  // i colori mancanti si campionano dalle fotografie: unica via quando la
  // pagina non contiene esadecimali
  let complete = await completaDaImmagini(varianti);

  // Rete di sicurezza. Il campionamento dal canvas può fallire per ragioni
  // fuori dal nostro controllo: immagine non raggiungibile, canvas bloccato
  // dalle politiche di origine, formato non decodificabile. In quel caso si
  // usano i colori di riferimento già misurati, dichiarandone la provenienza.
  // Preferiamo un dato verificato e marcato come tale a una variante muta.
  complete = await applicaRiferimenti(complete);

  stato.varianti = complete;
  if (stato.profilo !== null || stato.severita > 0) mostraEsito();
}

async function applicaRiferimenti(varianti) {
  if (varianti.every((v) => v.hex)) return varianti;
  let rif;
  try {
    rif = (await (await fetch('demo-page/measured.json')).json()).varianti;
  } catch {
    return varianti; // nessun riferimento disponibile: le varianti mute restano mute
  }
  return varianti.map((v) => {
    if (v.hex) return v;
    const m = rif.find((r) => r.nome === v.nome);
    return m ? { ...v, hex: m.hex, daRiferimento: true } : v;
  });
}

/* ---------- mini-test ---------- */

function punto(hex, titolo) {
  const d = document.createElement('span');
  d.className = 'punto';
  d.style.background = hex;
  if (titolo) d.title = titolo;
  return d;
}

function costruisciTest() {
  const contenitore = el('coppie');
  for (const c of COPPIE) {
    const b = document.createElement('button');
    b.className = 'coppia';
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', `${c.nota}: segna se ti sembrano lo stesso colore`);

    const casella = document.createElement('span');
    casella.className = 'casella';
    casella.textContent = '\u2713';

    const punti = document.createElement('span');
    punti.className = 'punti';
    punti.append(punto(c.a), punto(c.b));

    const et = document.createElement('span');
    et.className = 'et';
    et.textContent = c.nota;

    const segno = document.createElement('span');
    segno.className = 'segno';
    segno.textContent = 'uguali';

    b.append(casella, punti, et, segno);
    b.addEventListener('click', () => {
      const ora = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(ora));
      ora ? stato.segnate.add(c.id) : stato.segnate.delete(c.id);
      aggiornaConteggio();
    });
    contenitore.append(b);
  }
}

function aggiornaConteggio() {
  const n = stato.segnate.size;
  el('conteggio').textContent = n === 0
    ? 'Nessuna coppia segnata — se le distingui tutte, prosegui pure.'
    : `${n} ${n === 1 ? 'coppia segnata' : 'coppie segnate'}.`;
  el('conferma').textContent = n === 0 ? 'Prosegui' : `Analizza la pagina (${n})`;
}

/* ---------- esito ---------- */

function mostraEsito() {
  const sezione = el('fase-esito');
  const prof = stato.profilo;
  const sev = stato.severita;

  if (!prof) {
    sezione.innerHTML = `
      <h2>Esito</h2>
      <div class="esito-profilo">Nessuna coppia confusa: la tua visione distingue tutte le combinazioni del test.
      Puoi comunque usare il cursore qui sotto per vedere come apparirebbe questa pagina a chi ha una difficoltà.</div>`;
    costruisciCursore(sezione, 'deuteranomalia');
    return;
  }

  const coppie = coppieConfondibili(stato.varianti, prof, sev);
  const ok = distinguibili(stato.varianti, coppie);
  const ignote = senzaColore(stato.varianti);

  sezione.innerHTML = `<h2>Esito</h2>
    <div class="esito-profilo">
      Profilo: <strong>${ETICHETTE[prof].breve}</strong> · ${ETICHETTE[prof].nota}
    </div>`;
  costruisciCursore(sezione, prof);

  /* avvisi */
  const avvisi = document.createElement('div');
  avvisi.innerHTML = '<h2>Attenzione</h2>';
  if (!coppie.length) {
    const p = document.createElement('div');
    p.className = 'nessun-avviso';
    // L'icona non è decorativa: avviso e conferma sono entrambi scuri per
    // garantire il contrasto, e due colori scuri sull'asse rosso-verde
    // collassano. Il significato lo porta il segno, non la tinta
    // (WCAG 2.x, criterio 1.4.1 — lo stesso che contestiamo ai cataloghi).
    p.innerHTML = '<span class="segnale" aria-hidden="true">\u2713</span>';
    const testo = document.createElement('span');
    testo.textContent = sev === 0
      ? 'Con il cursore a zero nessuna variante si confonde: è la visione senza difficoltà.'
      : 'Nessuna di queste varianti si confonde con un’altra: puoi scegliere guardando i colori.';
    p.append(testo);
    avvisi.append(p);
  } else {
    for (const c of coppie) {
      const box = document.createElement('div');
      box.className = 'avviso';
      box.innerHTML = '<div class="titolo"><span class="segnale" aria-hidden="true">\u26a0</span>Queste due ti appariranno uguali</div>';
      for (const v of [c.a, c.b]) {
        const riga = document.createElement('div');
        riga.className = 'capo';
        riga.append(punto(simula(v.hex, stato.profilo, sev)));
        const t = document.createElement('span');
        t.innerHTML = `<strong>${v.nome}</strong> — in realtà ${nomeConCautela(v.hex)}`;
        riga.append(t);
        box.append(riga);
      }
      const spiega = document.createElement('div');
      spiega.className = 'spiega';
      spiega.textContent = `Entrambe ti sembreranno ${nomeConCautela(simula(c.a.hex, prof, sev))}. Qui conviene fidarsi del nome, non della fotografia.`;
      const num = document.createElement('div');
      num.className = 'numeri';
      num.textContent = `distanza fra i due colori: ${c.reale.toFixed(0)} nella realtà → ${c.percepita.toFixed(1)} come li vedi tu`;
      box.append(spiega, num);
      avvisi.append(box);
    }
  }
  sezione.append(avvisi);

  /* distinguibili */
  if (ok.length) {
    const h = document.createElement('h2');
    h.textContent = 'Queste le distingui';
    const lista = document.createElement('div');
    lista.className = 'elenco';
    for (const v of ok) lista.append(chip(v));
    sezione.append(h, lista);
  }

  /* colore non ricavabile */
  if (ignote.length) {
    const h = document.createElement('h2');
    h.textContent = 'Colore non determinabile';
    const p = document.createElement('div');
    p.style.fontSize = '13.5px';
    p.style.color = 'var(--tenue)';
    p.textContent = `Di ${ignote.map((v) => `“${v.nome}”`).join(', ')} la pagina non rivela il colore e la fotografia non è leggibile. Preferiamo dirlo piuttosto che indovinare.`;
    sezione.append(h, p);
  }

  /* confronto prima/dopo */
  const h = document.createElement('h2');
  h.textContent = 'Come li vedi tu, come li vede chi non ha difficoltà';
  const conf = document.createElement('div');
  conf.className = 'confronto';
  conf.append(fila('senza difficoltà', stato.varianti.map((v) => v.hex)));
  conf.append(fila('come li vedi tu', stato.varianti.map((v) => (v.hex ? simula(v.hex, prof, sev) : null))));
  sezione.append(h, conf);

  /* provenienza dei colori: rende visibile cosa ha funzionato e cosa no,
     invece di lasciare l'utente davanti a un risultato inspiegabile */
  const prov = document.createElement('div');
  prov.className = 'provenienza';
  const riga = (v) => {
    const fonte = v.daImmagine ? 'fotografia'
      : v.daRiferimento ? 'dati di riferimento'
      : v.campionamentoFallito ? 'FOTO NON LETTA'
      : v.hex ? 'markup'
      : 'NESSUNA';
    return `${v.nome}: ${v.hex ?? '—'} (${fonte})`;
  };
  prov.textContent = stato.varianti.map(riga).join('  ·  ');
  sezione.append(prov);

  /* dettaglio variante */
  const dett = document.createElement('div');
  dett.id = 'dettaglio';
  sezione.append(dett);
  if (stato.selezionata) mostraDettaglio(stato.selezionata);

  const ri = document.createElement('button');
  ri.className = 'ri';
  ri.textContent = 'Rifai il test';
  ri.addEventListener('click', () => location.reload());
  sezione.append(ri);
}

function chip(v) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.type = 'button';
  b.append(punto(v.hex ? simula(v.hex, stato.profilo ?? 'deuteranomalia', stato.severita) : '#ccc'));
  const t = document.createElement('span');
  t.textContent = v.nome;
  b.append(t);
  b.addEventListener('click', () => { stato.selezionata = v.nome; mostraEsito(); });
  return b;
}

function fila(etichetta, colori) {
  const f = document.createElement('div');
  f.className = 'fila';
  const et = document.createElement('span');
  et.className = 'et';
  et.textContent = etichetta;
  const punti = document.createElement('span');
  punti.className = 'punti';
  for (const c of colori) punti.append(punto(c ?? '#e4e4e0', c ? undefined : 'colore non determinabile'));
  f.append(et, punti);
  return f;
}

function costruisciCursore(sezione, profiloPredefinito) {
  const box = document.createElement('div');
  box.className = 'cursore';
  box.innerHTML = `<label><span>Quanto è marcata</span><span id="valore"></span></label>`;
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0'; range.max = '1'; range.step = '0.05';
  range.value = String(stato.severita);
  range.addEventListener('input', () => {
    stato.severita = Number(range.value);
    if (!stato.profilo) stato.profilo = profiloPredefinito;
    mostraEsito();
  });
  box.append(range);
  sezione.append(box);
  const v = box.querySelector('#valore');
  v.textContent = stato.severita === 0 ? 'nessuna difficoltà' : `${Math.round(stato.severita * 100)}%`;
}

function mostraDettaglio(nome) {
  const v = stato.varianti.find((x) => x.nome === nome);
  if (!v?.hex) return;
  const percepito = simula(v.hex, stato.profilo, stato.severita);
  const d = el('dettaglio');
  d.className = 'dettaglio';
  d.innerHTML = `
    <dl style="margin:0">
      <dt>Nome dato dal venditore</dt><dd><strong>${v.nome}</strong></dd>
      <dt>Che colore è davvero</dt><dd>${nomeConCautela(v.hex)} <span style="color:var(--tenue)">(${v.hex})</span></dd>
      <dt>Come lo vedrai tu</dt><dd>${nomeConCautela(percepito)}</dd>
      ${v.daImmagine ? '<dt>Nota</dt><dd style="color:var(--tenue);font-size:13px">Colore stimato dalla fotografia: la pagina non lo indicava.</dd>' : ''}
      ${v.daRiferimento ? '<dt>Nota</dt><dd style="color:var(--tenue);font-size:13px">Colore da dati di riferimento misurati: la pagina non lo indicava e la fotografia non era leggibile.</dd>' : ''}
    </dl>`;
}

/* ---------- avvio ---------- */

costruisciTest();
aggiornaConteggio();
el('conferma').addEventListener('click', () => {
  const r = profiloDa([...stato.segnate]);
  stato.profilo = r.profilo;
  stato.severita = r.severita;
  el('fase-test').classList.add('nascosto');
  el('fase-esito').classList.remove('nascosto');
  mostraEsito();
});
el('sito').addEventListener('load', leggiScheda);
if (el('sito').contentDocument?.readyState === 'complete') leggiScheda();
