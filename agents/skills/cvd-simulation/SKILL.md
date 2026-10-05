---
name: cvd-simulation
description: Come simulare correttamente una deficienza della visione dei colori e come misurare quali colori diventano indistinguibili. Usala prima di scrivere o modificare codice che trasforma colori, calcola distanze percettive o decide se due tinte si confondono.
allowed-tools: Read Grep Edit Write Bash
---

# Simulare una deficienza della visione dei colori

## Quando si applica

Prima di toccare qualunque codice in `app/src/colorlab/`, o di scegliere i colori
di una palette che deve restare leggibile a chi ha una CVD.

## Il modello da usare

**Machado, Oliveira & Fernandes (2009)**, *A Physiologically-based Model for
Simulation of Color Vision Deficiency*, IEEE TVCG. È peer-reviewed, gestisce in un
quadro unico sia la dicromazia (assenza totale di un tipo di cono) sia la
tricromazia anomala (cono presente ma spostato), e gli autori pubblicano le matrici.

Non implementare le matrici a mano. Usa `culori`, che le include nella forma
fornita dagli autori:

```js
import { filterDeficiencyDeuter, filterDeficiencyProt, filterDeficiencyTrit } from 'culori';

const vedi = filterDeficiencyDeuter(0.8);   // severità 0..1
const percepito = vedi('#6B6454');
```

## Regole non negoziabili

1. **Non chiedere a un modello linguistico come appare un colore.** È una
   trasformazione matematica esatta: un LLM darebbe una stima non riproducibile,
   più lenta e più costosa. Questa regola è il cuore del progetto.

2. **La trasformazione va applicata in RGB lineare, non in sRGB.** `culori` lo fa
   internamente. Se mai dovessi implementarla altrove, converti prima
   (`srgb → linear`), applica la matrice, riconverti. Saltare questo passaggio
   produce risultati plausibili ma sbagliati — il tipo di errore che non si nota.

3. **La severità è un continuo, non un interruttore.** `0` è visione normale,
   `1` è la forma completa. La maggior parte delle persone sta nel mezzo: è per
   questo che l'interfaccia espone uno slider e non una casella.

## I tre assi

| Filtro | Asse | Diffusione |
|---|---|---|
| `filterDeficiencyDeuter` | rosso-verde | ~6% degli uomini — di gran lunga il più comune |
| `filterDeficiencyProt` | rosso-verde | ~2% degli uomini; i rossi perdono anche luminosità |
| `filterDeficiencyTrit` | blu-giallo | rarissimo |

## Misurare se due colori si confondono

Applica la simulazione a **entrambi**, poi misura la distanza percettiva fra i
risultati con ΔE2000:

```js
import { differenceCiede2000 } from 'culori';
const dE = differenceCiede2000();
const distanzaPercepita = dE(percepito(a), percepito(b));
```

**Confronta sempre i colori simulati, mai quelli originali.** Due colori lontani
nella realtà possono essere identici per la persona: è esattamente il caso che
cerchiamo.

### La soglia

Valore corrente: **ΔE2000 < 10** per dichiarare una coppia confondibile.

Non è un numero arbitrario né da cambiare a sentimento: è calibrato contro
`app/tests/confusion.test.js`, che contiene coppie con verità misurata sul campo.
Se modifichi la soglia, quel test è la specifica che deve continuare a passare.

## La condizione che si dimentica

Perché due colori collassino servono **due** cose insieme:

1. stanno sull'asse compromesso (uno tende al rosso, l'altro al verde)
2. hanno **luminosità simile**

La seconda è decisiva. Se un rosso è molto più scuro di un verde, la persona li
distingue *per quanto sono scuri* anche quando la tinta collassa. È il motivo per
cui una palette costruita come scala di luminosità resta leggibile anche quando
tutte le tinte convergono.

## Verificare un risultato

La documentazione di `culori` pubblica questo vettore di riferimento:

```js
['red', 'green', 'blue']
  .map(interpolate(['red','green','blue']))
  .map(filterDeficiencyProt(0.5))
  .map(formatHex)
// ⇒ ["#751800", "#664200", "#576c00", "#1a3e82", "#0010ff"]
```

È un riferimento **esterno**: verificarci contro significa non essere
autoreferenziali. Vive in `app/tests/simulate.test.js`.

Per un controllo su valori nuovi, delega a `color-validator`.
