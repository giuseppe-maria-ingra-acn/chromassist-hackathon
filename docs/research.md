# Fonti

## Quante persone riguarda

Una deficienza della visione dei colori interessa circa **1 uomo su 12 (8%)** e
**1 donna su 200 (0,5%)**: nell'ordine dei 350 milioni di persone.

- Colour Blind Awareness — <https://www.colourblindawareness.org/colour-blindness/>
- Almustanyir, A. (2025). *A Global Perspective of Color Vision Deficiency*.
  PMC / NIH — <https://pmc.ncbi.nlm.nih.gov/>
- National Eye Institute — <https://www.nei.nih.gov/>

## Il rimedio è già raccomandato

Colour Blind Awareness, nella pagina dedicata ai rivenditori, indica
esplicitamente che per vendere a persone con daltonismo occorre **etichettare i
prodotti con un nome di colore semplice**.

È la raccomandazione di chi rappresenta le persone interessate, e i cataloghi in
larga parte non la applicano: usano nomi commerciali opachi. ChromAssist genera
il nome semplice che avrebbe dovuto esserci.

- Colour Blind Awareness, sezione *Retailers* —
  <https://www.colourblindawareness.org/colour-blindness/colour-blindness-and-retail/>

## Lo standard lo richiede

**WCAG 2.x, criterio 1.4.1 — Use of Color**: il colore non deve essere l'unico
mezzo visivo per trasmettere un'informazione. Uno swatch colorato senza etichetta
testuale non soddisfa questo criterio.

- <https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html>

## Il modello di simulazione

**Machado, G. M., Oliveira, M. M., & Fernandes, L. A. F. (2009).**
*A Physiologically-based Model for Simulation of Color Vision Deficiency*.
IEEE Transactions on Visualization and Computer Graphics, 15(6), 1291-1298.

Peer-reviewed, oltre 300 citazioni. Gestisce in un quadro unico la dicromazia e
la tricromazia anomala: da qui il parametro di severità dell'applicazione, che
non si limita al caso completo. Gli autori pubblicano le matrici di
trasformazione, riprodotte in `app/src/colorlab/simulate.js`.

- <https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html>

## La distanza percettiva

**CIEDE2000**, nella formulazione di Sharma, Wu & Dalal (2005), implementata in
`app/src/colorlab/space.js`.

Si usa questa e non la distanza euclidea in Lab perché la sensibilità dell'occhio
non è uniforme: ΔE76 sovrastima le differenze nei blu e le sottostima nei verdi,
rendendo inaffidabile qualunque soglia.

## Misure sul campo

I colori in `app/demo-page/measured.json` sono stati campionati dalle fotografie
di un catalogo reale, su una scheda prodotto con otto varianti. L'analisi di un
listing da 96 capi dello stesso catalogo ha prodotto il dato che ha orientato il
progetto: **54 nomi colore diversi, nessun valore leggibile da una macchina**, e
più di un nome in contrasto con la fotografia — un capo etichettato `black`
risultava `#764C36`, un marrone.
