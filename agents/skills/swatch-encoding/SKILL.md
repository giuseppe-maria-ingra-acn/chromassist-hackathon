---
name: swatch-encoding
description: I modi in cui gli e-commerce codificano il colore di una variante prodotto, e come aggiungere il supporto a un sito nuovo. Usala prima di scrivere un parser in app/src/extract/ o quando una pagina non viene letta correttamente.
allowed-tools: Read Grep Edit Write
---

# Come gli e-commerce codificano il colore

## Il fatto che sorprende

Su molti cataloghi **il colore non esiste come dato**. Non c'è nessun esadecimale
da nessuna parte: c'è un nome commerciale e una fotografia.

Verificato su un catalogo reale di grandi dimensioni: su 96 prodotti, 54 nomi
colore distinti, e zero valori leggibili da una macchina. Nomi come
`streamsong`, `magnet/pebble`, `forest night` non descrivono un colore — e in più
di un caso sono **errati**: un capo etichettato `black` risultava `#764C36`, cioè
un marrone.

Conseguenza progettuale: l'unica fonte affidabile del colore è **l'immagine**.
I nomi servono a preservare il linguaggio del venditore, non a ricavare la tinta.

## I pattern osservati

| Pattern | Dove sta il dato | Parser |
|---|---|---|
| Suffisso del titolo | ultimo segmento dopo l'ultimo `" - "` | `titleSuffix.js` |
| Dati strutturati | `<script type="application/ld+json">` → campo `color` (stringa, non hex) | `jsonLd.js` |
| Varianti correlate | link allo stesso articolo con slug diverso; il nome è dentro l'URL | `variantLinks.js` |
| Testo alternativo | `alt` dell'immagine: a volte nomina il colore meglio del titolo, e nella lingua del sito | `altText.js` |
| **La fotografia** | i pixel — **l'unica fonte del colore vero** | `imageSample.js` |

Ordine di tentativo: i primi quattro per il **nome**, l'ultimo per il **colore**.
Sono complementari, non alternativi: servono entrambi.

## Campionare il colore da una fotografia

```js
const im = new Image();
im.crossOrigin = 'anonymous';   // senza questo: SecurityError sul canvas
```

Il canvas viene "contaminato" da un'immagine di altra origine e `getImageData()`
fallisce, **a meno che** l'immagine sia caricata con `crossOrigin` e il server
mandi header CORS permissivi. I CDN dei grandi cataloghi di norma lo fanno —
va verificato per ogni sito nuovo, ed è la prima cosa da controllare quando un
sito non funziona.

Procedura di campionamento:

1. ritaglia la regione centrale (il capo sta lì, non ai bordi)
2. scarta i pixel di sfondo — chiari e poco saturi
3. raggruppa i restanti in bucket e prendi il dominante
4. se nessun bucket supera una quota minima, il capo è multicolore:
   **dichiaralo** invece di restituire una media priva di senso

## Aggiungere un sito nuovo

Usa `/add-encoding-pattern <url>`, che manda `encoding-scout` a ispezionare la
pagina e tornare con la codifica in forma strutturata. Poi scrivi il parser
seguendo `agents/workflows/build-extractor.md`.

## Vincolo che non si viola mai

**Il nome del venditore si preserva alla lettera.** Si aggiunge informazione
accanto, non si sostituisce: se il catalogo dice `new taupe green`, quella stringa
deve comparire verbatim nell'output. Verificato da `app/tests/fidelity.test.js`.
