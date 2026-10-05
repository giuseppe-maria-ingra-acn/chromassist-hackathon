# ChromAssist

Rende leggibili i colori delle varianti prodotto a chi ha una deficienza della
visione dei colori (CVD).

Su una scheda prodotto il colore si scegli da pallini senza etichetta. Chi non li
distingue ha come unica fonte il nome — e i nomi sono `forest night`,
`magnet/pebble`, `streamsong`. ChromAssist traduce il nome commerciale nel colore
reale, e il colore reale in come quella persona lo percepirà, segnalando quali
varianti le risulteranno indistinguibili.

## Avvio

Nessuna installazione, nessuna chiave, nessun servizio esterno.

```bash
cd app
python3 -m http.server 4173
# poi apri http://localhost:4173
```

I test non richiedono nulla oltre a Node:

```bash
cd app && node --test tests/
```

## Come funziona

Quattro problemi, quattro risposte deterministiche.

| Problema | Soluzione |
|---|---|
| Come appare un colore sotto CVD | Matrici di Machado, Oliveira & Fernandes (2009), applicate in RGB lineare |
| Quali coppie diventano indistinguibili | ΔE2000 (CIEDE2000) fra i **colori simulati** |
| Leggere gli swatch dalla pagina | Un lettore per codifica; dove il colore manca, campionamento dei pixel della fotografia |
| Dire a parole che colore è | Il nome di riferimento più vicino per distanza percettiva |

**Nessun modello linguistico a runtime.** La simulazione è una trasformazione
matematica esatta: un modello darebbe una stima non riproducibile, più lenta e
più costosa. E uno strumento di accessibilità che richiede credenziali a chi ne
ha bisogno è uno strumento peggiore.

### Il criterio di segnalazione

Una coppia è segnalata solo se valgono **due** condizioni insieme:

1. **vicinanza** — i colori percepiti distano meno di `VICINI` (ΔE2000)
2. **crollo** — la distanza percepita è una frazione di quella reale

La seconda è quella che isola il problema vero. Due bianchi sporchi sono simili
per chiunque: segnalarli non direbbe nulla sulla CVD. Interessano le coppie che
il profilo di visione **avvicina** — colori che il venditore presenta come
alternative distinte e che per questa persona diventano la stessa cosa.

### Il profilo si ricava da un mini-test

Nessun menu con termini medici: molte persone sanno di confondere certi colori
senza conoscere il nome della propria condizione. L'applicazione mostra quattro
coppie e chiede quali sembrano uguali. Tre sono diagnostiche per un asse e un
grado, la quarta è un controllo che nessuno dovrebbe confondere.

Le soglie delle coppie sono verificate in `app/tests/selftest.test.js` con la
stessa matematica della simulazione.

## Struttura

```
app/                      applicazione — zero dipendenze
  index.html              interfaccia a due pannelli
  demo-page/              scheda prodotto di riferimento, con codifiche miste
  src/colorlab/           spazio colore, ΔE2000, matrici CVD
  src/extract/            lettori di pagina, uno per codifica
  src/selftest.js         mini-test del profilo di visione
  src/describe.js         esadecimale → nome di colore comune
  scripts/confusion.mjs   calcolo da riga di comando
  tests/                  40 test, nessuna dipendenza

tools/                    strumenti eseguibili che riusano il nucleo di calcolo
agents/                   struttura agentica, usata per costruire il progetto
presentation/             presentazione del progetto
docs/research.md          le fonti
```

`.claude/` contiene collegamenti simbolici verso `agents/`: sorgente unica,
leggibile dove serve e caricata dove serve.

## Strumenti

Script senza dipendenze che riusano il nucleo di calcolo. Dettagli in
`tools/README.md`.

| Strumento | A cosa serve |
|---|---|
| `tools/verifica-palette.mjs` | Dice se una palette resta leggibile a chi ha una CVD. Esce con codice 1 in caso di problemi, quindi si usa in pipeline |
| `tools/valuta-eval.mjs` | Assegna un punteggio all'output di `encoding-scout`, su criteri binari |
| `app/scripts/confusion.mjs` | Calcola quali colori diventano indistinguibili, dato un profilo |

`verifica-palette` è il caso d'uso **inverso** dell'applicazione: non aiuta chi
compra a districarsi fra colori mal etichettati, ma chi progetta a non creare il
problema. Esempio che si incontra davvero — verde «disponibile» contro rosso
«esaurito»: distano 63 nella realtà e **6.8** per chi ha una deficienza
rosso-verde.

## La struttura agentica

In Claude Code un sub-agente è un file markdown: il frontmatter è la
configurazione, il corpo è il prompt di sistema. Non descrive un agente, lo
definisce.

| | Cosa fa |
|---|---|
| `agents/skills/cvd-simulation` | Come si simula correttamente una CVD e come si verifica un risultato |
| `agents/skills/swatch-encoding` | I modi in cui i cataloghi codificano il colore, e come aggiungerne uno |
| `agents/subagents/encoding-scout` | Ispeziona una pagina e riporta dove vive il colore |
| `agents/subagents/color-validator` | Verifica un risultato di simulazione contro valori di riferimento |
| `agents/subagents/a11y-reviewer` | Rilegge i testi dal punto di vista di chi non vede quei colori |
| `agents/commands/verify-confusion` | Esegue `scripts/confusion.mjs` e ne spiega l'esito |
| `agents/commands/add-encoding-pattern` | Aggiunge il supporto a un catalogo nuovo |
| `agents/workflows/build-extractor` | I cinque passi per un nuovo lettore di pagina |
| `agents/evals/encoding-scout.eval.md` | Misura se lo scout riporta correttamente le codifiche |
| `agents/hooks/` | Due automatismi che fanno rispettare i vincoli del progetto |

Gli skill sono stati scritti **prima** del codice che li usa, e la cronologia dei
commit lo mostra.

### Gli hook

Due vincoli del progetto non sono affidati alla memoria di chi modifica il
codice, ma imposti dalla macchina:

- **nessuna dipendenza** — una modifica che la introduca in `package.json` viene
  rifiutata, con il motivo
- **test dopo ogni modifica al nucleo** — girano offline in meno di un secondo,
  quindi non c'è ragione di rimandarli

Vanno autorizzati esplicitamente, perché eseguono script: istruzioni in
`agents/hooks/README.md`.

### Scelta del modello

Tutti i sub-agenti ereditano il modello principale. Scendere di livello è una
decisione da misurare, non da dichiarare: `agents/evals/encoding-scout.eval.md`
esiste per quello. Il criterio che discrimina è il secondo — dichiarare
l'**assenza** di un esadecimale invece di inventarne uno plausibile — perché è il
fallimento più probabile di un modello più debole, ed è anche quello che
produrrebbe un'analisi sbagliata con l'apparenza della completezza.

## Verifica

40 test, in esecuzione offline in meno di un secondo.

- **Riferimento esterno** — ΔE2000 fra bianco e nero vale esattamente `100.00`,
  il valore canonico per CIEDE2000.
- **Proprietà fisiologiche** — gli acromatici restano acromatici su ogni profilo;
  sull'asse rosso-verde il blu puro è il meno alterato.
- **Verità misurata** — `burgundy crush` ⟷ `new taupe green` deve essere
  segnalata (distanza 29,5 reale → 7,5 percepita); due quasi-bianchi non devono,
  perché non è la CVD ad avvicinarli.
- **Lettori di pagina** — un attributo non valido viene scartato, non accettato;
  una variante senza colore restituisce `null`, mai un valore dedotto dal nome.

## Limiti

- Il colore è **stimato da una fotografia**, non misurato sul tessuto: dipende da
  illuminazione, post-produzione e compressione. Serve a stabilire se due opzioni
  si confondono, non a certificare una tinta.
- Un capo **multicolore** rompe l'ipotesi del colore dominante. L'applicazione lo
  rileva e lo dichiara invece di restituire una media priva di senso.
- Le soglie sono una **media statistica**, non la vista di una persona precisa:
  per questo il cursore della severità resta in mano all'utente.
- Il campionamento dei pixel richiede che il server delle immagini mandi header
  CORS permissivi. Dove non accade, si ricade sui colori di riferimento misurati,
  dichiarandone la provenienza.

## Fonti

In `docs/research.md`.
