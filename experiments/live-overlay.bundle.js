/**
 * ChromAssist \u2014 overlay per pagine di catalogo reali.  FILE GENERATO.
 *
 * Non modificare questo file: si rigenera con
 *     node experiments/assembla.mjs
 * Le modifiche vanno nei moduli in app/src/ o in experiments/overlay-ui.js.
 *
 * USO: apri una scheda prodotto e incolla l'intero file nella console
 * degli strumenti sviluppatore.
 *
 * Generato il 2026-10-05 13:24
 */
(() => {
/* ===== app/src/colorlab/space.js ===== */
/**
 * Conversioni di spazio colore e distanza percettiva.
 * Nessuna dipendenza: l'applicazione deve funzionare aprendo una pagina,
 * senza installazioni n\u00e9 passaggi di build.
 */
function hexToRgb(hex) {
  const h = String(hex).trim().replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Colore non interpretabile: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** sRGB (0..255) \u2192 lineare (0..1). Le matrici CVD vanno applicate qui, non in sRGB. */
const srgbToLinear = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

/** lineare (0..1) \u2192 sRGB (0..255). */
const linearToSrgb = (v) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
};

const D65 = [0.95047, 1, 1.08883];
function rgbToLab(rgb) {
  const [R, G, B] = rgb.map(srgbToLinear);
  let xyz = [
    (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / D65[0],
    (R * 0.2126729 + G * 0.7151522 + B * 0.0721750) / D65[1],
    (R * 0.0193339 + G * 0.1191920 + B * 0.9503041) / D65[2]
  ];
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [x, y, z] = xyz.map(f);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const rad = (d) => (d * Math.PI) / 180;
const hueDeg = (b, a) => {
  if (a === 0 && b === 0) return 0;
  const d = (Math.atan2(b, a) * 180) / Math.PI;
  return d >= 0 ? d : d + 360;
};

/**
 * \u0394E2000 (CIEDE2000) nella formulazione di Sharma, Wu & Dalal.
 * Si usa questa e non la distanza euclidea in Lab perch\u00e9 la sensibilit\u00e0
 * dell'occhio non \u00e8 uniforme: \u0394E76 sovrastima le differenze nei blu e
 * le sottostima nei verdi, e la soglia diventerebbe inaffidabile.
 */
function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const kL = 1, kC = 1, kH = 1;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = hueDeg(b1, a1p);
  const h2p = hueDeg(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp) / 2);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp;
  if (C1p * C2p === 0) hbarp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
  else hbarp = (h1p + h2p - 360) / 2;

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.20 * Math.cos(rad(4 * hbarp - 63));

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
  const SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin(rad(2 * dTheta)) * RC;

  return Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
      Math.pow(dCp / (kC * SC), 2) +
      Math.pow(dHp / (kH * SH), 2) +
      RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );
}

/** Distanza percettiva fra due esadecimali. */
const distanza = (hexA, hexB) => deltaE2000(rgbToLab(hexToRgb(hexA)), rgbToLab(hexToRgb(hexB)));

/* ===== app/src/colorlab/simulate.js ===== */
/**
 * Matrici di trasformazione di Machado, Oliveira & Fernandes (2009),
 * "A Physiologically-based Model for Simulation of Color Vision Deficiency",
 * IEEE Transactions on Visualization and Computer Graphics.
 *
 * Valori per severit\u00e0 1.0, come pubblicati dagli autori. Si applicano in
 * RGB LINEARE: applicarle in sRGB produce risultati plausibili ma sbagliati.
 */
const MATRICI = {
  deuteranomalia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.011820, 0.042940, 0.968881]
  ],
  protanomalia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  tritanomalia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.303900]
  ]
};

const IDENTITA = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const PROFILI = Object.keys(MATRICI);
const ETICHETTE = {
  deuteranomalia: { breve: 'rosso-verde', nota: 'la forma pi\u00f9 diffusa \u2014 circa un uomo su dodici' },
  protanomalia: { breve: 'rosso-verde, rossi pi\u00f9 scuri', nota: 'meno diffusa, i rossi perdono anche luminosit\u00e0' },
  tritanomalia: { breve: 'blu-giallo', nota: 'molto rara' }
};

/**
 * Interpolazione fra identit\u00e0 e matrice piena.
 *
 * Nota sul metodo: Machado pubblica matrici distinte per ogni grado di
 * severit\u00e0. Qui si interpola linearmente fra visione normale e forma
 * completa. A severit\u00e0 1 il risultato \u00e8 esatto; ai valori intermedi \u00e8
 * un'approssimazione che conserva l'andamento progressivo del collasso.
 * Per lo scopo dello strumento \u2014 stabilire SE due colori si confondono \u2014
 * \u00e8 adeguata, e il caso che conta per l'accessibilit\u00e0 (severit\u00e0 alta) \u00e8 esatto.
 */
function matrice(profilo, severita) {
  const M = MATRICI[profilo];
  if (!M) throw new Error(`Profilo sconosciuto: ${profilo}`);
  if (!(severita >= 0 && severita <= 1)) throw new Error(`Severit\u00e0 fuori intervallo: ${severita}`);
  return M.map((riga, i) => riga.map((v, j) => IDENTITA[i][j] + (v - IDENTITA[i][j]) * severita));
}

/**
 * Come appare un colore a chi ha la deficienza indicata.
 * @param {string} hex
 * @param {'deuteranomalia'|'protanomalia'|'tritanomalia'} profilo
 * @param {number} severita 0 = visione normale, 1 = forma completa
 */
function simula(hex, profilo, severita = 1) {
  const M = matrice(profilo, severita);
  const lin = hexToRgb(hex).map(srgbToLinear);
  return rgbToHex(M.map((riga) => linearToSrgb(Math.max(0, Math.min(1, riga[0] * lin[0] + riga[1] * lin[1] + riga[2] * lin[2])))));
}

/* ===== app/src/colorlab/confusion.js ===== */
/**
 * Una coppia \u00e8 confondibile quando valgono DUE condizioni insieme.
 *
 * 1. VICINANZA \u2014 i colori percepiti distano meno di VICINI.
 *    Riferimento: sotto 1 la differenza \u00e8 invisibile, oltre 10 si coglie
 *    a colpo d'occhio. Gli swatch di un catalogo sono piccoli e non
 *    adiacenti, quindi la soglia utile \u00e8 pi\u00f9 alta di quella da laboratorio.
 *
 * 2. CROLLO \u2014 la distanza percepita \u00e8 una frazione di quella reale.
 *    \u00c8 questa la condizione che isola il problema vero. Due bianchi sporchi
 *    sono simili per chiunque: segnalarli non direbbe nulla sul daltonismo.
 *    Ci interessano le coppie che il profilo di visione AVVICINA, cio\u00e8
 *    colori che il venditore presenta come alternative distinte e che per
 *    questa persona diventano la stessa cosa.
 *
 * Entrambe calibrate contro app/tests/confusion.test.js, che contiene coppie
 * con verit\u00e0 misurata su fotografie reali. Quel test \u00e8 la specifica.
 */
const VICINI = 15;
const CROLLO = 0.6;

/** Distanza fra due colori cos\u00ec come li vede il profilo indicato. */
function distanzaPercepita(a, b, profilo, severita) {
  return distanza(simula(a, profilo, severita), simula(b, profilo, severita));
}

/**
 * Le coppie che collassano, dalla pi\u00f9 critica.
 * Si confrontano sempre i colori SIMULATI: due tinte lontane nella realt\u00e0
 * possono essere identiche per la persona, ed \u00e8 proprio il caso che cerchiamo.
 */
function coppieConfondibili(varianti, profilo, severita) {
  const note = varianti.filter((v) => v.hex);
  const esiti = [];
  for (let i = 0; i < note.length; i++) {
    for (let j = i + 1; j < note.length; j++) {
      const a = note[i];
      const b = note[j];
      const percepita = distanzaPercepita(a.hex, b.hex, profilo, severita);
      const reale = distanza(a.hex, b.hex);
      if (percepita < VICINI && percepita < reale * CROLLO) {
        esiti.push({ a, b, reale, percepita });
      }
    }
  }
  return esiti.sort((x, y) => x.percepita - y.percepita);
}

/** Varianti con colore noto che non compaiono in nessuna coppia confondibile. */
function distinguibili(varianti, coppie) {
  const coinvolte = new Set(coppie.flatMap((c) => [c.a.nome, c.b.nome]));
  return varianti.filter((v) => v.hex && !coinvolte.has(v.nome));
}

/** Varianti di cui la pagina non rivela il colore. */
function senzaColore(varianti) {
  return varianti.filter((v) => !v.hex);
}

/* ===== app/src/describe.js ===== */
/**
 * Nomi di colore di riferimento, in italiano comune.
 * Servono a dire a parole che tinta \u00e8 un esadecimale: si cerca il nome pi\u00f9
 * vicino per distanza percettiva. La frase non \u00e8 generata, \u00e8 calcolata \u2014
 * stesso colore, stesso nome, sempre.
 */
const RIFERIMENTI = [
  ['nero', '#111111'], ['grigio scuro', '#4A4A4A'], ['grigio', '#808080'],
  ['grigio chiaro', '#C8C8C8'], ['bianco', '#F7F7F5'], ['avorio', '#EDE8D8'],
  ['beige', '#D8C9A8'], ['sabbia', '#C2B280'], ['marrone', '#6B4A2F'],
  ['marrone chiaro', '#9C7A58'], ['tortora', '#8B8178'], ['marrone grigio', '#6E6459'],
  ['ruggine', '#B7410E'], ['terracotta', '#C16B4A'], ['arancione', '#E8731A'],
  ['giallo senape', '#C9A227'], ['giallo', '#EFD23A'], ['giallo verdino', '#D9DC8A'],
  ['verde oliva', '#6B6B3A'], ['verde tortora', '#6B6454'], ['verde militare', '#4B5320'],
  ['verde', '#2E7D32'], ['verde chiaro', '#7CB97F'], ['verde bosco', '#1E3F23'],
  ['verde acqua', '#2E9B8F'], ['turchese', '#30B5B0'], ['azzurro', '#5BA4D8'],
  ['blu', '#1F4FA0'], ['blu navy', '#1F2A44'], ['blu polvere', '#AEBDD4'],
  ['viola', '#6A3F9E'], ['lilla', '#B79BD4'], ['magenta', '#B4357F'],
  ['rosa', '#E79BB4'], ['rosa antico', '#C98A94'], ['rosso', '#C62828'],
  ['rosso vinaccia', '#8E2440'], ['bordeaux', '#6B1F2E'], ['prugna', '#5B2A42']
];

/** Il nome di riferimento pi\u00f9 vicino, con la sua distanza percettiva. */
function nomeColore(hex) {
  let migliore = null;
  let minima = Infinity;
  for (const [nome, rif] of RIFERIMENTI) {
    const d = distanza(hex, rif);
    if (d < minima) { minima = d; migliore = nome; }
  }
  return { nome: migliore, scostamento: minima };
}

/**
 * Quanto \u00e8 affidabile il nome trovato. Oltre una certa distanza il colore
 * sta fra due riferimenti e il nome va presentato con cautela.
 */
function nomeConCautela(hex) {
  const { nome, scostamento } = nomeColore(hex);
  if (scostamento < 8) return nome;
  if (scostamento < 18) return `tendente al ${nome}`;
  return `vicino al ${nome}`;
}

/* ===== app/src/selftest.js ===== */
/**
 * Mini-test per ricavare il profilo di visione.
 *
 * Nessun menu con termini medici: moltissime persone sanno di confondere
 * certi colori senza conoscere il nome della propria condizione. Si chiede
 * una cosa che chiunque sa rispondere \u2014 quali coppie sembrano uguali \u2014 e si
 * deduce il resto.
 *
 * Ogni coppia \u00e8 diagnostica per un asse e per un grado. Le soglie sono
 * verificate in app/tests/selftest.test.js con la matematica della simulazione.
 */
const COPPIE = [
  { id: 'rg-forte', asse: 'rosso-verde', severita: 0.6, a: '#C0392B', b: '#6B8E23',
    nota: 'rosso mattone e verde oliva' },
  { id: 'rg-fine', asse: 'rosso-verde', severita: 1.0, a: '#9A2645', b: '#6B6454',
    nota: 'rosso vinaccia e verde tortora' },
  { id: 'by', asse: 'blu-giallo', severita: 0.9, a: '#2E9B8F', b: '#5BA4D8',
    nota: 'verde acqua e azzurro' },
  { id: 'controllo', asse: null, severita: 0, a: '#1F2A44', b: '#E2DDA5',
    nota: 'blu navy e giallo chiaro \u2014 nessuno dovrebbe confonderli' }
];

const PER_ASSE = { 'rosso-verde': 'deuteranomalia', 'blu-giallo': 'tritanomalia' };

/**
 * Dalle coppie segnate come "uguali" ricava profilo e severit\u00e0.
 * @param {string[]} segnate  id delle coppie indicate come indistinguibili
 */
function profiloDa(segnate) {
  const scelte = COPPIE.filter((c) => segnate.includes(c.id) && c.asse);
  if (!scelte.length) {
    return { profilo: null, severita: 0, messaggio: 'Nessuna coppia confusa: la tua visione dei colori distingue tutte le combinazioni del test.' };
  }

  // l'asse con pi\u00f9 segnalazioni vince; a parit\u00e0 prevale il rosso-verde,
  // di gran lunga pi\u00f9 diffuso
  const conteggio = {};
  for (const c of scelte) conteggio[c.asse] = (conteggio[c.asse] ?? 0) + 1;
  const asse = Object.keys(conteggio).sort((x, y) =>
    conteggio[y] - conteggio[x] || (x === 'rosso-verde' ? -1 : 1))[0];

  // la severit\u00e0 \u00e8 quella della coppia pi\u00f9 difficile fra le segnalate:
  // confondere una coppia molto contrastata indica una forma pi\u00f9 marcata
  const severita = Math.max(...scelte.filter((c) => c.asse === asse).map((c) => c.severita));

  const incoerente = segnate.includes('controllo');
  return {
    profilo: PER_ASSE[asse],
    severita,
    asse,
    messaggio: incoerente
      ? 'Hai segnato anche la coppia di controllo, che di norma si distingue: il risultato \u00e8 indicativo e puoi correggerlo con il cursore.'
      : null
  };
}

/* ===== interfaccia dell'overlay (solo in questo esperimento) ===== */

/**
 * Legge le varianti colore da una scheda prodotto del catalogo.
 *
 * Qui il colore NON esiste come dato: non c'\u00e8 nessun esadecimale nel markup.
 * Esistono un nome commerciale e una fotografia. Il nome si ricava
 * dall'attributo `alt` delle miniature \u2014 "Selezionato, <colore>" oppure
 * "Non selezionato, <colore>".
 *
 * Si usa l'alt e non i nomi delle classi CSS perch\u00e9 su questo catalogo le
 * classi sono generate automaticamente (`JT3_zV`, `mo6ZnF`) e cambiano a
 * ogni rilascio: un selettore costruito su quelle si romperebbe da solo.
 * L'attributo alt invece esiste per i lettori di schermo, quindi \u00e8 stabile
 * per la stessa ragione per cui serve a noi.
 *
 * Funziona su qualunque scheda prodotto del catalogo, non su una in
 * particolare: non c'\u00e8 nessun identificativo di articolo nel selettore.
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
      hex: null, // da campionare: nel markup non c'\u00e8
      imageUrl: risoluzioneUtile(img.currentSrc || img.src),
      selezionata: !/^Non/.test(img.alt)
    });
  }

  // Nessun selettore colore: il prodotto esiste in una sola tinta.
  // Non ci sono coppie da confondere, ma met\u00e0 del problema resta: il nome
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
 * Il nome sta nell'ultimo segmento del titolo dopo l'ultimo " - ", che \u00e8 il
 * formato di questo catalogo. La fotografia \u00e8 la pi\u00f9 grande fra quelle
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

/** Le miniature sono piccole: una pi\u00f9 grande d\u00e0 un campione pi\u00f9 stabile. */
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
         * gruppo di pixel pi\u00f9 numeroso.
         *
         * Decisivo su una fotografia indossata. Misurato su una giacca beige:
         * il capo intimo scuro forma un gruppo compatto al 27% dei pixel,
         * mentre il beige della giacca \u00e8 spezzato dall'ombreggiatura in nove
         * gruppi che valgono insieme il 50%. Ancorandosi al pi\u00f9 numeroso si
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
  // n\u00e9 il pannello alterare la pagina. Su un sito che non controlliamo \u00e8
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
      <div id="corpo"><div class="attesa">Lettura delle varianti\u2026</div></div>
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
         Toccane quante ne riconosci \u2014 se nessuna, prosegui pure.</p>
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
      // resta da tradurre \u2014 ed \u00e8 la parte utile a chiunque, non solo a chi
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
      fila('senza difficolt\u00e0', varianti.map((v) => v.hex)),
      fila('come li vedi tu', varianti.map((v) => (v.hex ? simula(v.hex, prof, sev) : null)))
    );

    $('#prov').textContent = varianti
      .map((v) => `${v.nome}: ${v.hex ?? '\u2014'} (${v.daImmagine ? 'fotografia' : 'non ricavato'})`)
      .join('  \u00b7  ');
  }

  mostraTest();
  console.log(`ChromAssist: ${varianti.length} varianti lette da questa pagina.`);
})();

})();
