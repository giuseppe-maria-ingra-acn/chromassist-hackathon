#!/usr/bin/env bash
# Hook PostToolUse — esegue i test dopo ogni modifica al nucleo di calcolo.
#
# Il nucleo è la tesi del progetto: una matrice sbagliata di poco produce
# risultati plausibili e falsi — il tipo di errore che guardando non si nota,
# perché il colore esce comunque "di un colore sensato".
#
# I test girano offline in meno di un secondo e non richiedono nulla di
# installato, quindi non c'è ragione di rimandarli a dopo.
set -uo pipefail

payload=$(cat)
percorso=$(printf '%s' "$payload" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

case "$percorso" in
  *app/src/*|*app/tests/*) ;;
  *) exit 0 ;;
esac

radice="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! esito=$(cd "$radice/app" && node --test tests/ 2>&1); then
  {
    echo "I test non passano dopo questa modifica."
    echo
    printf '%s\n' "$esito" | grep -E '^(not ok|ℹ fail)' | head -12
    echo
    echo "Se hai cambiato una soglia, ricorda che app/tests/confusion.test.js"
    echo "è la specifica: contiene coppie con verità misurata su fotografie reali."
  } >&2
  exit 2
fi

printf '%s\n' "$esito" | grep -E '^ℹ (tests|pass|fail)' | tr '\n' ' '
echo
exit 0
