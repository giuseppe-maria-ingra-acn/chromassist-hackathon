---
name: verify-confusion
description: Calcola quali colori diventano indistinguibili per un dato profilo di visione, a partire da una lista di esadecimali.
argument-hint: <tipo> <severità> <hex...>
---

## Risultato del calcolo

!`node app/scripts/confusion.mjs $ARGUMENTS`

## Istruzioni

Spiega l'output qui sopra in linguaggio comune:

1. Quali coppie risultano indistinguibili, usando i nomi se presenti.
2. Quanto erano lontani in partenza — il contrasto fra distanza reale e
   percepita è il dato che si capisce da solo.
3. Su quale caratteristica residua la persona può ancora appoggiarsi per
   distinguerle, se ce n'è una.

Non usare termini tecnici senza spiegarli. Se nessuna coppia collassa, dillo
chiaramente: è un esito positivo, non un fallimento del calcolo.
