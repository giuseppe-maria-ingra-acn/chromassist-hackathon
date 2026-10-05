#!/usr/bin/env bash
# Hook PreToolUse — difende il vincolo numero uno del progetto.
#
# ChromAssist deve restare a zero dipendenze: si apre e funziona, senza
# installazioni né build. È ciò che lo rende utilizzabile da chi ne ha bisogno,
# senza chiedergli di configurare nulla.
#
# Un vincolo scritto solo in CLAUDE.md si viola per distrazione. Qui viene
# fatto rispettare dalla macchina: uscendo con codice 2 la modifica è bloccata
# e il motivo arriva a chi la stava facendo.
set -euo pipefail

payload=$(cat)
leggi() { printf '%s' "$payload" | python3 -c "import json,sys; d=json.load(sys.stdin).get('tool_input',{}); print($1)" 2>/dev/null || echo ""; }

percorso=$(leggi "d.get('file_path','')")
case "$percorso" in
  */package.json) ;;
  *) exit 0 ;;
esac

contenuto=$(leggi "d.get('content') or d.get('new_string') or ''")

if printf '%s' "$contenuto" | grep -qE '"(dependencies|devDependencies|peerDependencies)"[[:space:]]*:[[:space:]]*\{[[:space:]]*"'; then
  {
    echo "Bloccato: questa modifica introduce una dipendenza in package.json."
    echo
    echo "ChromAssist è a zero dipendenze per scelta, non per caso: deve aprirsi"
    echo "e funzionare senza installazioni, perché è uno strumento di accessibilità"
    echo "e chi ne ha bisogno non deve configurare un ambiente per usarlo."
    echo
    echo "Se la funzione serve davvero, implementala in app/src/ — come già fatto"
    echo "per lo spazio colore, il CIEDE2000 e le matrici di simulazione."
  } >&2
  exit 2
fi

exit 0
