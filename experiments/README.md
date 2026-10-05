# ChromAssist su un negozio online vero

## Che cos'è

**ChromAssist** dice a chi ha una deficienza della visione dei colori quali
varianti colore di un prodotto, su un negozio online, gli risulteranno
indistinguibili fra loro — e come si chiamano davvero quei colori.

L'applicazione principale (in `app/`, vedi il [README del
progetto](../README.md)) lavora su una scheda prodotto di esempio. **Questo
esperimento fa la stessa cosa su una pagina reale di un negozio**, aperta nel
tuo browser.

Serve a rispondere a una domanda concreta: funziona anche fuori dal nostro
banco di prova? Sì — verificato su tre pagine diverse, con i risultati più
sotto.

## Perché serve un approccio diverso

L'applicazione legge la scheda prodotto da un iframe della stessa origine. Con
un sito esterno non è possibile: il browser **vieta** di leggere il contenuto
di un iframe che appartiene a un altro dominio. Non è un ostacolo da aggirare,
è la regola che impedisce a una pagina qualunque di spiare le altre pagine che
hai aperto.

La via praticabile è opposta: non portare il sito dentro l'applicazione, ma il
codice dentro il sito. È la forma che prenderebbe un'estensione del browser.
Qui è realizzata nel modo più economico: un file da incollare una volta nella
console degli strumenti sviluppatore.

## Cosa serve

| | Versione | Verifica |
|---|---|---|
| **Node** | 20 o successiva | `node --version` |
| Un browser | Chrome, Safari o Firefox | — |

Node serve solo se vuoi **rigenerare** il file; per usarlo così com'è basta il
browser. Nessuna installazione, nessuna dipendenza.

## Come si usa

Si lavora in **due posti diversi**, e confonderli è l'errore più facile:

| | Dove | Cosa ci va |
|---|---|---|
| Passo 1 | **Terminale** (Terminal, iTerm) | comandi di sistema |
| Passi 2-4 | **Console del browser** | JavaScript |

Un comando come `pbcopy` scritto nella console del browser restituisce
`ReferenceError: pbcopy is not defined`, perché lì dentro gira solo
JavaScript.

---

### Passo 1 — nel TERMINALE

Mette il contenuto dello script negli appunti:

```bash
cd /percorso/dove/hai/clonato/chromassist-hackathon
pbcopy < experiments/live-overlay.bundle.js             # macOS
xclip -sel clip < experiments/live-overlay.bundle.js    # Linux
```

Non stampa niente: è normale. Il file è negli appunti.

Attenzione a copiare il **contenuto**, non il percorso: incollando il percorso
la console risponde `Invalid regular expression flags`.

### Passo 2 — nel BROWSER

Apri la **pagina di dettaglio di un singolo prodotto** su un negozio online.
L'indirizzo finisce in `.html` e la pagina mostra prezzo, taglie e il
selettore dei colori.

Non funziona su:

| | Perché |
|---|---|
| Pagine di elenco o categoria (`/giacche-donna/`) | contengono molti prodotti diversi, non le varianti di uno |
| Risultati di ricerca | come sopra |
| Carrello, home, pagine editoriali | non c'è nessun prodotto da analizzare |

Lo strumento confronta **i colori alternativi dello stesso capo**, perché è
quella la scelta in cui una persona si blocca. Confrontare prodotti differenti
fra loro è un altro problema, che richiederebbe una logica diversa.

> Lo script riconosce il formato di un negozio online specifico, quello su cui
> è stato sviluppato. Su un sito diverso i selettori non corrispondono e il
> pannello lo dichiara, invece di indovinare.

### Passo 3 — apri la console del browser

| | |
|---|---|
| Chrome | `Cmd + Option + J` · `Ctrl + Shift + J` |
| Safari | `Cmd + Option + C` (serve il menu Sviluppo attivo nelle preferenze) |
| Firefox | `Cmd + Option + K` · `Ctrl + Shift + K` |

### Passo 4 — nella CONSOLE, incolla

Chrome blocca l'incolla in console la prima volta. **Digita a mano** (non
incollare) le parole:

```
allow pasting
```

premi Invio, poi `Cmd + V` e Invio.

> **Un solo file da incollare**: `experiments/live-overlay.bundle.js`, quello
> del passo 1. Nient'altro.

Quel blocco di Chrome è una protezione sensata: codice incollato in console
ottiene pieno accesso alla pagina, sessione compresa. Prima di fidarti puoi
controllare cosa fa questo script — non legge cookie e non invia dati da
nessuna parte, le sue uniche richieste di rete sono le fotografie del
prodotto, che gli servono per leggerne i pixel.

Il file da incollare è generato concatenando altri file, quindi è lungo e
ripetitivo da leggere. Se vuoi rivederlo, conviene partire dai **sorgenti**,
che sono gli stessi file ma leggibili uno per uno:

| File | Contiene |
|---|---|
| `experiments/overlay-ui.js` | lettura della pagina e interfaccia del pannello |
| `app/src/colorlab/` | la matematica dei colori |
| `app/src/describe.js` | da esadecimale a nome di colore |
| `app/src/selftest.js` | le quattro coppie del test |

Questi **non** si incollano: servono solo a leggere.

### Come capisci che è andata

In console compare una riga come:

```
ChromAssist: 8 varianti lette da questa pagina.
```

Il numero dipende da quante varianti ha il prodotto aperto.

**Poi chiudi la console**: il pannello appare sulla **destra della pagina**,
non dentro la console — che occupando mezzo schermo lo copre. Si chiude con il
**×** in alto a destra del pannello.

### Cosa fare nel pannello

| | Cosa fare | Cosa deve succedere |
|---|---|---|
| 1 | Clicca una o più coppie che ti sembrano dello stesso colore | La casella si spunta, compare `UGUALI`, il pulsante diventa **Analizza la pagina (n)** |
| 2 | Clicca **Analizza la pagina** | Appare l'esito con il profilo di visione riconosciuto |
| 3 | Guarda sotto **ATTENZIONE** | Arancione se due varianti collassano, verde se nessuna |
| 4 | Muovi il cursore *«Quanto è marcata»* | A zero nessun colore collassa; verso destra le coppie si avvicinano |
| 5 | Guarda le due file di pallini in fondo | Sopra come li vede chi non ha difficoltà, sotto come li vede l'utente |

Se non trovi nessuna coppia non è un errore: su un prodotto dove tutte le
varianti sono ben separate è l'esito corretto. L'ultima riga del pannello
mostra, variante per variante, il colore letto e da dove viene.

### Se qualcosa non va

| Messaggio o sintomo | Causa |
|---|---|
| `pbcopy is not defined` | comando di terminale incollato nella console del browser |
| `Invalid regular expression flags` | incollato il **percorso** del file invece del contenuto: rifai il passo 1 |
| `Unexpected identifier 'paste'` | scritto `allow paste` invece di `allow pasting` |
| `Nessuna variante colore trovata` | non è una pagina di dettaglio prodotto, oppure il prodotto esiste in un solo colore |
| Il pannello non si vede | è dietro la console: chiudila |

## Non serve il server

Il file è autonomo: si porta dietro tutta la matematica. Un'estensione del
browser funziona sulla macchina di chi la installa, dove `localhost` non
esiste.

## Come è costruito

```
app/src/colorlab/space.js       ┐
app/src/colorlab/simulate.js    │  i moduli veri,
app/src/colorlab/confusion.js   ├─ quelli coperti dai 53 test
app/src/describe.js             │
app/src/selftest.js             ┘
experiments/overlay-ui.js       ← lettura del DOM e interfaccia
         ↓
   node experiments/assembla.mjs
         ↓
experiments/live-overlay.bundle.js   ← FILE GENERATO, non modificarlo
```

Dopo ogni modifica ai moduli o all'interfaccia:

```bash
node experiments/assembla.mjs
```

**Perché un assemblatore invece di riscrivere la matematica nello script.**
Riscriverla a mano significherebbe due copie che divergono alla prima
correzione: una nei test, una no. Qui il codice resta uno — i moduli vengono
concatenati togliendo `import` ed `export`, che in un file da incollare non
servono.

## Come legge la pagina

Su questo catalogo **il colore non esiste come dato**: non c'è nessun
esadecimale nel markup. Ci sono un nome commerciale e una fotografia.

| Passo | Da dove |
|---|---|
| Nome del colore | attributo `alt` delle miniature: `"Non selezionato, garnet"` |
| Colore vero | campionamento dei pixel della fotografia |
| Se non c'è il selettore colore | nome dall'ultimo segmento del titolo, foto principale della pagina |

L'`alt` si usa **al posto dei nomi delle classi CSS** perché su quel sito le
classi sono generate automaticamente (`JT3_zV`, `mo6ZnF`) e cambiano a ogni
rilascio: un selettore costruito su quelle si romperebbe da solo. L'`alt`
invece esiste per i lettori di schermo, quindi è stabile per la stessa ragione
per cui ci serve.

Nessun identificativo di articolo compare nei selettori: funziona su qualunque
scheda prodotto del catalogo, non su una in particolare.

## Cosa è stato verificato sul campo

| Pagina | Esito |
|---|---|
| Giacca con 8 varianti | 8 varianti lette, coppia `burgundy crush` ⟷ `new taupe green` segnalata (reale 29,2 → percepita 10,9) |
| Sneakers con 7 varianti | 7 varianti lette, nomi e colori completamente diversi, 2 correttamente marcate multicolore |
| Stivaletti a tinta unica | nessuna coppia possibile; il ripiego legge `"cognac"` → **marrone chiaro**, percepito sabbia |

Il secondo caso è la prova che i colori vengono letti davvero: nomi come
`mystic dates/metallic silver/rust` non esistono in nessun file del progetto.

## Due errori trovati provando sul sito vero

Entrambi erano **anche nell'applicazione principale**, mascherati dalle
immagini sintetiche a tinta piatta della pagina demo. Le correzioni sono in
`app/src/extract/imageSample.js`, non solo qui.

### Il gruppo più numeroso non è il colore del capo

Su una giacca beige fotografata indossata, il campionamento restituiva
`#080705` — nero. I gruppi di pixel reali:

```
#050504   27%   ← il capo intimo scuro: un gruppo compatto
#74644B    8%  ┐
#85755B    7%  │  il beige della giacca, spezzato
#B4A48B    6%  ├─ dall'ombreggiatura in nove gruppi
#A5947B    6%  │  che insieme valgono il 50%
   ...         ┘
```

L'algoritmo si ancorava al gruppo **più numeroso** — il nero al 27% — e
scartava il resto come troppo lontano. Ma il beige, sommato, è il doppio.

La correzione cerca il colore attorno al quale si concentra **più massa
totale**: per ogni candidato si misura il peso del suo intorno, e vince
l'intorno più pesante. Esito su quella giacca: `#93826A`, beige, coesione 52%.
Sulle altre tre varianti il valore resta uguale ma la coesione sale
(89%→93%, 91%→96%, 80%→94%): più pixel concordano.

### La soglia del «multicolore» era tarata su immagini finte

Segnalava a caso sulle fotografie reali: pieghe e ombre distribuiscono i pixel
su decine di sfumature, e il gruppo più popoloso raccoglie solo il 18-43% anche
su capi dichiaratamente monocolore. Quattro giacche a tinta unita su otto
risultavano «fantasia».

Il criterio corretto non guarda quanto è popoloso il colore più frequente, ma
se la massa sta **attorno** a una tinta (ombreggiatura) o **sparsa su tinte
lontane** (fantasia vera). Misurato sul campo: i capi a tinta unita stanno fra
il 76% e il 99% di coesione.

### Perché vale la pena raccontarlo

Nessuno dei due si vedeva sulla pagina demo. Erano visibili solo su
fotografie vere, con illuminazione vera — e li ha trovati il fatto di aver
provato su un sito reale invece di fidarsi dei propri dati di prova.

## Limiti

- **Riconosce il formato di un catalogo specifico.** Su un sito diverso i
  selettori non corrispondono e il pannello lo dichiara invece di indovinare.
- **Il colore dipende dalla fotografia scelta.** Uno scatto indossato con ombre
  dà un valore più scuro del packshot su fondo bianco: sulla giacca, `burgundy
  crush` esce `#6B172B` dallo scatto indossato contro `#9A2645` dal packshot.
  La coppia viene comunque individuata, ma serve il cursore più a destra.
- **Richiede header CORS permissivi** sul CDN delle immagini. Dove non ci
  sono, il canvas si contamina e il colore resta ignoto — dichiarato come
  `non ricavato`.
- **Incollare in console non è un prodotto.** Per un uso vero servirebbe
  un'estensione: stesso codice, più un manifesto e un pulsante.
