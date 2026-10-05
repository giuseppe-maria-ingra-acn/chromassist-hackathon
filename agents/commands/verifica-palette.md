---
name: verifica-palette
description: Controlla se una palette di colori resta leggibile a chi ha una deficienza della visione dei colori, e spiega l'esito.
argument-hint: <hex...> oppure --file <palette.json>
---

## Risultato della verifica

!`node tools/verifica-palette.mjs $ARGUMENTS`

## Istruzioni

Commenta l'esito qui sopra per chi progetta l'interfaccia, non per chi ha
scritto lo strumento:

1. Se delle coppie sono **rese indistinguibili**, di' quali e che cosa
   distinguono nel prodotto — due stati, due categorie, due azioni. Il peso
   del problema dipende da cosa quel colore sta comunicando.
2. Proponi un rimedio concreto: differenziare la luminosità, oppure affiancare
   al colore un secondo segnale (etichetta, icona, posizione).
3. Se invece la palette regge, di' **perché** regge: serve a chi dovrà
   estenderla senza romperla.
4. Le coppie segnalate come «già vicine di loro» non sono un problema di
   accessibilità. Menzionale solo se qualcuna porta un'informazione importante.

Non riportare i numeri grezzi senza interpretarli.
