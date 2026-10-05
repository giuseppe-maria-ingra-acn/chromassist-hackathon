# Workflow — aggiungere un parser di estrazione

Multi-step, da eseguire in ordine. Ogni passo ha un esito verificabile.

## 1. Ispezione

Manda `encoding-scout` sulla pagina. Ottieni il blocco strutturato con: fonte del
nome colore, presenza o assenza di esadecimale, selettore dell'immagine, origine.

**Esito**: il blocco `SITO/NOME COLORE/ESADECIMALE/IMMAGINE/NOTE` compilato.

## 2. Decisione

Confronta con i pattern già coperti in `agents/skills/swatch-encoding/SKILL.md`.

- Pattern già coperto → nessun parser nuovo, estendi il selettore di quello esistente.
- Pattern nuovo → prosegui.

**Esito**: una riga che dice quale dei due casi è, e perché.

## 3. Parser

Scrivi `app/src/extract/<nome>.js`. Contratto unico per tutti i parser:

```js
export function parse(doc) {
  // → [{ nome: string, hex: string|null, imageUrl: string|null }]
  // nome: SEMPRE il testo del venditore, verbatim
  // hex:  null se la pagina non lo contiene — mai dedotto dal nome
}
```

Registralo in `app/src/extract/index.js`, in coda: l'ordine è il fallback.

**Esito**: il parser esporta `parse` e compare nel registro.

## 4. Test

Aggiungi un caso in `app/tests/extract.test.js` con un frammento reale della
pagina e il risultato atteso. Includi **un caso negativo**: una variante priva di
esadecimale deve restituire `hex: null`, non un valore inventato.

**Esito**: `npm test` passa.

## 5. Verifica incrociata

Se il parser ricava colori, manda `color-validator` a confrontarli con i valori
campionati dalle immagini. Scostamenti ampi indicano un selettore sbagliato.

**Esito**: `CONFORME`, oppure una discrepanza spiegata.

## Limite di iterazione

Se dopo **due** tentativi il parser non estrae il colore, fermati e riporta cosa
blocca. Non accumulare casi speciali: di norma significa che la pagina non
contiene il dato e la via è il campionamento dell'immagine.
