# Eval — encoding-scout

Misura se il sub-agente riporta correttamente **dove** vive il colore in una
pagina. Serve a una decisione concreta: stabilire su quale livello di modello
farlo girare.

## Metodo

Per ogni caso in `cases/`, esegui `encoding-scout` sul file e confronta l'output
con la verità attesa. I criteri sono binari: nessun giudizio a sensazione.

## Criteri

| # | Criterio | Perché |
|---|---|---|
| 1 | Individua la fonte del nome colore | È il dato che si preserva verbatim |
| 2 | **Dichiara `presente: NO` quando l'esadecimale non c'è** | Il fallimento più probabile: riempire un vuoto con un valore plausibile |
| 3 | Individua l'immagine e ne riporta l'origine | Determina se il campionamento è possibile |
| 4 | Rispetta il formato di output | Un formato libero non è componibile |

Il criterio 2 è quello che discrimina. Un esadecimale inventato è peggio di un
dato mancante: produce un'analisi sbagliata con l'apparenza della completezza.

## Casi

| Caso | Verità attesa |
|---|---|
| `cases/pdp-varianti.html` | nome: suffisso titolo + slug — esadecimale: **NO** — immagine: origine diversa |
| `cases/listing.html` | nome: suffisso titolo — esadecimale: **NO** — immagine: origine diversa |
| `cases/con-hex.html` | nome: `aria-label` — esadecimale: **sì**, `style` inline — immagine: stessa origine |

Il terzo caso è il controllo inverso: un agente che rispondesse sempre
`presente: NO` passerebbe i primi due per caso, e deve fallire qui.

## Esito e decisione

| Modello | 1 | 2 | 3 | 4 | Decisione |
|---|---|---|---|---|---|
| principale | | | | | riferimento |
| economico | | | | | adottato se pari al riferimento |

Si scende di livello **solo** con esito pari. Il risultato va riportato nel
README, incluso il caso in cui si resta sul modello più capace.
