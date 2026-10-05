# Hooks

Due automatismi che fanno rispettare dalla macchina i vincoli del progetto,
invece di affidarli alla memoria di chi modifica il codice.

| Hook | Evento | Cosa fa |
|---|---|---|
| `blocca-dipendenze.sh` | `PreToolUse` | Rifiuta ogni modifica che introduca una dipendenza in `package.json` |
| `verifica-dopo-modifica.sh` | `PostToolUse` | Esegue i 40 test dopo ogni modifica a `app/src/` o `app/tests/` |

## Perché questi due

**Zero dipendenze** è il vincolo che rende l'applicazione utilizzabile senza
configurare nulla. Scritto solo in `CLAUDE.md` si viola per distrazione: qui
la modifica viene bloccata e il motivo arriva a chi la stava facendo.

**I test dopo ogni modifica** perché il nucleo di calcolo è la tesi del
progetto, e una matrice sbagliata di poco produce risultati plausibili e falsi
— il tipo di errore che guardando non si nota. I test girano offline in meno di
un secondo, quindi non c'è ragione di rimandarli.

## Attivazione

Gli hook eseguono script, quindi vanno autorizzati esplicitamente: copia il
contenuto di `settings.esempio.json` in `.claude/settings.json`.

## Verifica

```bash
# deve uscire con codice 2 e spiegare il motivo
echo '{"tool_input":{"file_path":"app/package.json","content":"{\"dependencies\":{\"x\":\"1\"}}"}}' \
  | ./agents/hooks/blocca-dipendenze.sh

# deve stampare l'esito dei test e uscire con codice 0
echo "{\"tool_input\":{\"file_path\":\"$PWD/app/src/colorlab/space.js\"}}" \
  | ./agents/hooks/verifica-dopo-modifica.sh
```
