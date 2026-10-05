/* ===== interfaccia dell'overlay (solo in questo esperimento) ===== */

/**
 * Legge le varianti colore da una scheda prodotto del catalogo.
 *
 * Qui il colore NON esiste come dato: non c'è nessun esadecimale nel markup.
 * Esistono un nome commerciale e una fotografia. Il nome si ricava
 * dall'attributo `alt` delle miniature — "Selezionato, <colore>" oppure
 * "Non selezionato, <colore>".
 *
 * Si usa l'alt e non i nomi delle classi CSS perché su questo catalogo le
 * classi sono generate automaticamente (`JT3_zV`, `mo6ZnF`) e cambiano a
 * ogni rilascio: un selettore costruito su quelle si romperebbe da solo.
 * L'attributo alt invece esiste per i lettori di schermo, quindi è stabile
 * per la stessa ragione per cui serve a noi.
 *
 * Funziona su qualunque scheda prodotto del catalogo, non su una in
 * particolare: non c'è nessun identificativo di articolo nel selettore.
 */
function leggiVarianti() {
  const trovate = [];
  const visti = new Set();

  for (const img of document.querySelectorAll('img[alt]')) {
    const m = img.alt.match(/^(?:Non\s+)?[Ss]elezionato,\s*(.+)$/);
    if (!m) continue;
    const nome = m[1].trim();
    if (!nome || visti.has(nome)) continue;
    visti.add(nome);
    trovate.push({
      nome,
      hex: null, // da campionare: nel markup non c'è
      imageUrl: risoluzioneUtile(img.currentSrc || img.src),
      selezionata: !/^Non/.test(img.alt)
    });
  }

  // Nessun selettore colore: il prodotto esiste in una sola tinta.
  // Non ci sono coppie da confondere, ma metà del problema resta: il nome
  // commerciale non dice che colore sia. Si legge la variante corrente dal
  // titolo e si campiona la foto principale.
  if (!trovate.length) {
    const unica = varianteCorrente();
    if (unica) trovate.push(unica);
  }

  return trovate;
}

/**
 * La variante mostrata, per pagine che non hanno un selettore colore.
 *
 * Il nome sta nell'ultimo segmento del titolo dopo l'ultimo " - ", che è il
 * formato di questo catalogo. La fotografia è la più grande fra quelle
 * servite dal CDN delle immagini prodotto: una miniatura di navigazione o
 * un'icona non raggiungono quelle dimensioni.
 */
function varianteCorrente() {
  const titolo = document.querySelector('h1')?.textContent?.trim();
  if (!titolo || !titolo.includes(' - ')) return null;
  const nome = titolo.split(' - ').pop().trim();
  if (!nome) return null;

  const foto = [...document.querySelectorAll('img')]
    .filter((i) => /ztat\.net|\/spp-media/.test(i.currentSrc || i.src || ''))
    .sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight)[0];
  if (!foto) return null;

  return {
    nome,
    hex: null,
    imageUrl: risoluzioneUtile(foto.currentSrc || foto.src),
    selezionata: true,
    unica: true
  };
}

/** Le miniature sono piccole: una più grande dà un campione più stabile. */
function risoluzioneUtile(url) {
  try {
    const u = new URL(url);
    if (u.searchParams.has('imwidth')) u.searchParams.set('imwidth', '400');
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Campiona il colore dominante del capo dalla fotografia.
 * Richiede che il CDN del catalogo mandi header CORS permissivi: senza,
 * il canvas si contamina e i pixel non sono leggibili.
 */
function campiona(url) {
  return new Promise((risolvi) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onerror = () => risolvi(null);
    im.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = im.naturalWidth;
        c.height = im.naturalHeight;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(im, 0, 0);

        const x = Math.floor(c.width * 0.3);
        const y = Math.floor(c.height * 0.28);
        const w = Math.max(1, Math.floor(c.width * 0.4));
        const h = Math.max(1, Math.floor(c.height * 0.45));
        const d = cx.getImageData(x, y, w, h).data;

        const bucket = new Map();
        let considerati = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          if (max > 228 && max - min < 22) continue; // fondo bianco del packshot
          considerati++;
          const k = `${r >> 4},${g >> 4},${b >> 4}`;
          const e = bucket.get(k) ?? [0, 0, 0, 0];
          e[0] += r; e[1] += g; e[2] += b; e[3]++;
          bucket.set(k, e);
        }
        if (!considerati) return risolvi(null);

        /*
         * Si cerca il colore attorno al quale si concentra PIU MASSA, non il
         * gruppo di pixel più numeroso.
         *
         * Decisivo su una fotografia indossata. Misurato su una giacca beige:
         * il capo intimo scuro forma un gruppo compatto al 27% dei pixel,
         * mentre il beige della giacca è spezzato dall'ombreggiatura in nove
         * gruppi che valgono insieme il 50%. Ancorandosi al più numeroso si
         * otteneva nero su un capo beige.
         */
        const gruppi = [...bucket.values()]
          .map((e) => ({ colore: [0, 1, 2].map((i) => Math.round(e[i] / e[3])), peso: e[3] }))
          .sort((a, b) => b.peso - a.peso);

        const intorno = (rif) => {
          let peso = 0;
          const somma = [0, 0, 0];
          for (const g of gruppi) {
            if (Math.hypot(g.colore[0] - rif[0], g.colore[1] - rif[1], g.colore[2] - rif[2]) >= 60) continue;
            peso += g.peso;
            for (let i = 0; i < 3; i++) somma[i] += g.colore[i] * g.peso;
          }
          return { peso, colore: somma.map((v) => Math.round(v / peso)) };
        };

        const candidati = gruppi.filter((g) => g.peso / considerati >= 0.02).slice(0, 25);
        const vincente = (candidati.length ? candidati : [gruppi[0]])
          .map((g) => intorno(g.colore))
          .sort((a, b) => b.peso - a.peso)[0];

        risolvi({
          hex: '#' + vincente.colore.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase(),
          multicolore: vincente.peso / considerati < 0.55
        });
      } catch {
        risolvi(null);
      }
    };
    im.src = url;
  });
}

const STILE = `
  :host { all: initial }
  * { box-sizing: border-box; font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif }
  .pannello { height: 100vh; overflow-y: auto; background: #fff; color: #15151a;
              box-shadow: -2px 0 18px rgba(0,0,0,.12); padding: 20px 22px 40px;
              font-size: 14.5px; line-height: 1.5 }
  .testa { display: flex; justify-content: space-between; align-items: start;
           border-bottom: 1px solid #e2e2dd; padding-bottom: 12px; margin-bottom: 18px }
  .nome { font-weight: 700; font-size: 16px }
  .nome span { color: #4A3AA8 }
  .chiudi { border: 0; background: none; font-size: 22px; cursor: pointer; color: #6b6b75;
            line-height: 1; padding: 0 2px }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .09em; color: #6b6b75;
       margin: 22px 0 10px; font-weight: 600 }
  h2:first-of-type { margin-top: 0 }
  p { margin: 0 0 13px; font-size: 14px }
  .coppia { display: flex; align-items: center; gap: 11px; padding: 10px 12px;
            border: 1.5px solid #e2e2dd; border-radius: 10px; cursor: pointer;
            background: #fff; width: 100%; text-align: left; font: inherit; margin-bottom: 8px }
  .coppia[aria-pressed="true"] { border-color: #4A3AA8; background: #f4f1fb }
  .casella { width: 19px; height: 19px; border: 1.5px solid #c4c4bd; border-radius: 5px;
             flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
             font-size: 12px; color: #fff; font-weight: 700 }
  .coppia[aria-pressed="true"] .casella { background: #4A3AA8; border-color: #4A3AA8 }
  .punti { display: flex; gap: 5px; flex-wrap: wrap }
  .punto { width: 26px; height: 26px; border-radius: 50%; border: 1px solid rgba(0,0,0,.14);
           flex: 0 0 auto }
  .et { font-size: 13px; color: #6b6b75 }
  button.azione { width: 100%; padding: 11px; border: 0; border-radius: 9px;
                  background: #4A3AA8; color: #fff; font: 600 14.5px inherit;
                  cursor: pointer; margin-top: 12px }
  button.ri { background: none; border: 0; color: #4A3AA8; font: 13px inherit;
              cursor: pointer; padding: 0; margin-top: 16px; text-decoration: underline }
  .avviso { background: #fdf3e7; border-left: 3px solid #8a3b00; border-radius: 0 8px 8px 0;
            padding: 13px 15px; margin-bottom: 10px }
  .avviso .titolo { display: flex; gap: 8px; font-weight: 600; margin-bottom: 7px }
  .capo { display: flex; align-items: center; gap: 9px; margin: 5px 0 }
  .spiega { font-size: 13px; color: #6a4a2a; margin-top: 8px }
  .numeri { font-size: 12px; color: #6b6b75; margin-top: 6px }
  .ok { background: #f1f7f2; color: #1d5c2e; border-radius: 8px; padding: 12px 14px;
        display: flex; gap: 8px; font-size: 14px }
  .elenco { display: flex; flex-wrap: wrap; gap: 7px }
  .chip { display: flex; align-items: center; gap: 7px; border: 1px solid #e2e2dd;
          border-radius: 20px; padding: 4px 11px 4px 5px; font-size: 13px }
  .chip .punto { width: 18px; height: 18px }
  .fila { display: flex; align-items: center; gap: 10px; margin: 7px 0 }
  .fila .lab { font-size: 12px; color: #6b6b75; width: 112px; flex: 0 0 auto }
  .confronto { background: #f6f6f3; border-radius: 9px; padding: 13px 15px }
  .cursore label { display: flex; justify-content: space-between; font-size: 13px;
                   color: #6b6b75; margin: 14px 0 6px }
  input[type=range] { width: 100%; accent-color: #4A3AA8 }
  .prov { font-size: 11.5px; color: #6b6b75; margin-top: 18px; padding-top: 12px;
          border-top: 1px dashed #e2e2dd; word-break: break-word }
  .attesa { color: #6b6b75; font-size: 13.5px }
  .limite { font-size: 11.5px; color: #6b6b75; margin-top: 16px }
`;

/* ---------- avvio ---------- */

(async () => {
  document.getElementById('chromassist-live')?.remove();

  const radice = document.createElement('div');
  radice.id = 'chromassist-live';
  Object.assign(radice.style, {
    position: 'fixed', top: '0', right: '0', zIndex: '2147483647',
    height: '100vh', width: '400px', maxWidth: '92vw'
  });
  // Shadow DOM: gli stili del catalogo non devono influenzare il pannello,
  // né il pannello alterare la pagina. Su un sito che non controlliamo è
  // l'unico modo di ottenere un aspetto prevedibile.
  const ombra = radice.attachShadow({ mode: 'open' });
  ombra.innerHTML = `<style>${STILE}</style>
    <div class="pannello">
      <div class="testa">
        <div>
          <div class="nome">Chrom<span>Assist</span></div>
          <div style="font-size:12.5px;color:#6b6b75">su questa pagina</div>
        </div>
        <button class="chiudi" title="chiudi">&times;</button>
      </div>
      <div id="corpo"><div class="attesa">Lettura delle varianti…</div></div>
    </div>`;
  document.body.append(radice);

  const $ = (s) => ombra.querySelector(s);
  $('.chiudi').addEventListener('click', () => radice.remove());

  const varianti = leggiVarianti();
  if (!varianti.length) {
    $('#corpo').innerHTML = `<div class="attesa">
      Non ho trovato n&eacute; varianti colore n&eacute; un titolo da cui ricavare
      il colore corrente. Questo script legge il formato di un catalogo
      specifico: su un sito diverso servirebbe un lettore dedicato.</div>`;
    return;
  }

  for (const v of varianti) {
    const c = v.imageUrl ? await campiona(v.imageUrl) : null;
    if (c) { v.hex = c.hex; v.daImmagine = true; v.multicolore = c.multicolore; }
  }

  const stato = { profilo: null, severita: 0, segnate: new Set() };

  const punto = (hex) => {
    const d = document.createElement('span');
    d.className = 'punto';
    d.style.background = hex ?? '#e4e4e0';
    return d;
  };

  function mostraTest() {
    $('#corpo').innerHTML = `
      <h2>Come vedi i colori</h2>
      <p>Quali di queste coppie ti sembrano <strong>lo stesso colore</strong>?
         Toccane quante ne riconosci — se nessuna, prosegui pure.</p>
      <div id="coppie"></div>
      <div id="conteggio" style="font-size:13px;color:#6b6b75;text-align:center;margin-top:10px"></div>
      <button class="azione" id="vai">Prosegui</button>`;

    for (const c of COPPIE) {
      const b = document.createElement('button');
      b.className = 'coppia';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="casella">&#10003;</span><span class="punti"></span><span class="et">${c.nota}</span>`;
      b.querySelector('.punti').append(punto(c.a), punto(c.b));
      b.addEventListener('click', () => {
        const ora = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(ora));
        ora ? stato.segnate.add(c.id) : stato.segnate.delete(c.id);
        const n = stato.segnate.size;
        $('#conteggio').textContent = n ? `${n} ${n === 1 ? 'coppia segnata' : 'coppie segnate'}.` : '';
        $('#vai').textContent = n ? `Analizza la pagina (${n})` : 'Prosegui';
      });
      $('#coppie').append(b);
    }

    $('#vai').addEventListener('click', () => {
      const r = profiloDa([...stato.segnate]);
      stato.profilo = r.profilo ?? 'deuteranomalia';
      stato.severita = r.profilo ? r.severita : 0;
      mostraEsito();
    });
  }

  function mostraEsito() {
    const prof = stato.profilo;
    const sev = stato.severita;
    const coppie = coppieConfondibili(varianti, prof, sev);
    const ok = distinguibili(varianti, coppie);

    $('#corpo').innerHTML = `
      <h2>Esito</h2>
      <div style="background:#f6f6f3;border-radius:9px;padding:12px 14px;font-size:14px">
        Profilo: <strong>${ETICHETTE[prof].breve}</strong> &middot; ${ETICHETTE[prof].nota}
      </div>
      <div class="cursore">
        <label><span>Quanto &egrave; marcata la tua difficolt&agrave;</span><span>${sev === 0 ? 'nessuna' : Math.round(sev * 100) + '%'}</span></label>
        <input type="range" min="0" max="1" step="0.05" value="${sev}" id="sev">
        <div class="limite">${sev === 0
          ? 'A zero &egrave; la visione senza difficolt&agrave;. Spostalo a destra per vedere come apparirebbe questa pagina a chi ne ha una.'
          : 'Il daltonismo non &egrave; acceso o spento: la maggior parte delle persone sta nel mezzo. Se gli avvisi non corrispondono a come vedi davvero, correggi qui.'}</div>
      </div>
      <h2>Attenzione</h2>
      <div id="avvisi"></div>
      <h2>Queste le distingui</h2>
      <div class="elenco" id="ok"></div>
      <h2>Come li vedi tu, come li vede chi non ha difficolt&agrave;</h2>
      <div class="confronto" id="conf"></div>
      <button class="ri" id="ri">Rifai il test</button>
      <div class="prov" id="prov"></div>`;

    $('#sev').addEventListener('input', (e) => {
      stato.severita = Number(e.target.value);
      mostraEsito();
    });
    $('#ri').addEventListener('click', () => {
      stato.segnate.clear();
      stato.profilo = null;
      stato.severita = 0;
      mostraTest();
    });

    const avvisi = $('#avvisi');
    if (varianti.length === 1) {
      // Una sola variante: nessuna coppia possibile, ma il nome commerciale
      // resta da tradurre — ed è la parte utile a chiunque, non solo a chi
      // ha una deficienza.
      const v = varianti[0];
      avvisi.innerHTML = v.hex
        ? `<div class="ok" style="background:#f6f6f3;color:#15151a;display:block">
             <div style="margin-bottom:6px">Questo prodotto esiste in un solo colore,
             quindi non c&rsquo;&egrave; nessuna coppia da confondere.</div>
             <div><strong>${v.nome}</strong> &mdash; in realt&agrave;
             ${nomeConCautela(v.hex)}${sev > 0 ? `, che tu vedrai come ${nomeConCautela(simula(v.hex, prof, sev))}` : ''}.</div>
           </div>`
        : `<div class="ok" style="background:#f6f6f3;color:#15151a">Non riesco a
             ricavare il colore di <strong>${v.nome}</strong> da questa pagina.</div>`;
    } else if (!coppie.length) {
      avvisi.innerHTML = `<div class="ok"><span>&#10003;</span><span>${
        sev === 0
          ? 'Con il cursore a zero nessuna variante si confonde: &egrave; la visione senza difficolt&agrave;.'
          : 'Nessuna di queste varianti si confonde con un&rsquo;altra.'
      }</span></div>`;
    } else {
      for (const c of coppie) {
        const box = document.createElement('div');
        box.className = 'avviso';
        box.innerHTML = `<div class="titolo"><span>&#9888;</span>Queste due ti appariranno uguali</div>`;
        for (const v of [c.a, c.b]) {
          const riga = document.createElement('div');
          riga.className = 'capo';
          riga.append(punto(simula(v.hex, prof, sev)));
          const t = document.createElement('span');
          t.innerHTML = `<strong>${v.nome}</strong> &mdash; in realt&agrave; ${nomeConCautela(v.hex)}`;
          riga.append(t);
          box.append(riga);
        }
        box.insertAdjacentHTML('beforeend',
          `<div class="spiega">Entrambe ti sembreranno ${nomeConCautela(simula(c.a.hex, prof, sev))}.
           Qui conviene fidarsi del nome, non della fotografia.</div>
           <div class="numeri">distanza: ${c.reale.toFixed(0)} nella realt&agrave; &rarr;
           ${c.percepita.toFixed(1)} come li vedi tu</div>`);
        avvisi.append(box);
      }
    }

    for (const v of ok) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.append(punto(simula(v.hex, prof, sev)));
      const t = document.createElement('span');
      t.textContent = v.nome;
      chip.append(t);
      $('#ok').append(chip);
    }

    const fila = (etichetta, colori) => {
      const f = document.createElement('div');
      f.className = 'fila';
      f.innerHTML = `<span class="lab">${etichetta}</span><span class="punti"></span>`;
      for (const c of colori) f.querySelector('.punti').append(punto(c));
      return f;
    };
    $('#conf').append(
      fila('senza difficoltà', varianti.map((v) => v.hex)),
      fila('come li vedi tu', varianti.map((v) => (v.hex ? simula(v.hex, prof, sev) : null)))
    );

    $('#prov').textContent = varianti
      .map((v) => `${v.nome}: ${v.hex ?? '—'} (${v.daImmagine ? 'fotografia' : 'non ricavato'})`)
      .join('  ·  ');
  }

  mostraTest();
  console.log(`ChromAssist: ${varianti.length} varianti lette da questa pagina.`);
})();
