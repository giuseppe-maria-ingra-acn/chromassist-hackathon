# Strumenti

Script eseguibili, senza dipendenze, che riusano il nucleo di calcolo
dell'applicazione.

| Strumento | A cosa serve |
|---|---|
| `verifica-palette.mjs` | Dice se una palette resta leggibile a chi ha una deficienza della visione dei colori |
| `valuta-eval.mjs` | Assegna un punteggio all'output di `encoding-scout` su un caso dell'eval |
| `../app/scripts/confusion.mjs` | Calcola quali colori diventano indistinguibili, dato un profilo |

## verifica-palette

Il caso d'uso **inverso** dell'applicazione: invece di aiutare chi compra a
districarsi fra colori mal etichettati, aiuta chi progetta a non creare il
problema. Stessa matematica, altro capo del processo.

```bash
node tools/verifica-palette.mjs "#2E7D32" "#C62828"
node tools/verifica-palette.mjs --file palette.json --severita 0.6
```

Con `--file` si passa un JSON `{ "etichetta": "#RRGGBB", ... }`: le etichette
rendono leggibile il rapporto quando i colori sono molti.

Esce con codice **1** se la deficienza rende indistinguibili delle coppie,
quindi è utilizzabile in una pipeline per impedire che una palette
inaccessibile arrivi in produzione.

### Il verdetto è doppio, e la distinzione conta

```
causato       la distanza crolla → è la deficienza a creare il problema
preesistente  la distanza non cambia → è una scelta di design, uguale per tutti
```

Due colori vicini fra loro non sono automaticamente un problema di
accessibilità: possono essere gradini adiacenti di una scala, vicini per
chiunque e di proposito. Segnalarli insieme al caso vero produrrebbe allarmi
su cui nessuno può agire.

### Esempio che si incontra davvero

```bash
node tools/verifica-palette.mjs --file - <<'JSON'
{"disponibile":"#2E7D32","esaurito":"#C62828"}
JSON
```

Verde e rosso per «disponibile» e «esaurito» è la codifica più diffusa negli
e-commerce. Distano **63** nella realtà e **6.8** per chi ha una deficienza
rosso-verde: due stati opposti, indistinguibili.

## valuta-eval

L'agente va eseguito a mano — è un sub-agente, non una funzione — ma la
valutazione no: se fosse a sensazione, confrontare due modelli non
significherebbe nulla.

```bash
node tools/valuta-eval.mjs pdp-varianti.html output-agente.txt
```

Quattro criteri binari. Il secondo è quello che discrimina: **dichiarare
l'assenza** di un esadecimale invece di inventarne uno plausibile. È più
difficile che estrarre un valore presente, ed è il fallimento peggiore,
perché produce un'analisi sbagliata con l'apparenza della completezza.
