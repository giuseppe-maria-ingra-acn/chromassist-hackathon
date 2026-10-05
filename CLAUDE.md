# ChromAssist — istruzioni di progetto

Strumento che rende leggibili i colori delle varianti prodotto a chi ha una
deficienza della visione dei colori.

## Vincoli che non si violano

1. **Zero dipendenze e nessun servizio esterno a runtime.** L'applicazione si
   apre e funziona. Non aggiungere pacchetti, non introdurre chiamate di rete
   nel percorso d'uso, non richiedere credenziali. Uno strumento di accessibilità
   che le pretende è uno strumento peggiore.

2. **La simulazione dei colori è matematica, non un modello linguistico.**
   Mai chiedere a un LLM come appare un colore: è una trasformazione esatta.
   Prima di toccare `app/src/colorlab/`, leggi
   `agents/skills/cvd-simulation/SKILL.md`.

3. **Il nome scelto dal venditore si preserva alla lettera.** Si aggiunge
   informazione accanto, non si riscrive. Verificato dai test.

4. **Un colore assente resta `null`.** Non dedurlo dal nome, non stimarlo, non
   inventarlo. Dichiarare un'assenza è il risultato corretto.

## Dove guardare prima di modificare

| Tocchi | Leggi prima |
|---|---|
| `app/src/colorlab/` | `agents/skills/cvd-simulation/SKILL.md` |
| `app/src/extract/` | `agents/skills/swatch-encoding/SKILL.md` + `agents/workflows/build-extractor.md` |
| le soglie di confusione | `app/tests/confusion.test.js` — è la specifica, non un controllo a posteriori |
| i testi mostrati all'utente | fai rileggere da `a11y-reviewer` |

## Comandi

```bash
cd app && node --test tests/     # 40 test, offline, meno di un secondo
cd app && python3 -m http.server 4173   # l'applicazione
node app/scripts/confusion.mjs <profilo> <severità> [hex...]
```

Esistono anche `/verify-confusion` e `/add-encoding-pattern`.

## Stile

- Italiano nei commenti, nei nomi di variabile e nei testi dell'interfaccia.
- I commenti spiegano **perché**, non cosa: il codice dice già cosa fa.
- Preferisci una frase piana a una elegante, nei testi rivolti all'utente.
