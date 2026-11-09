#!/bin/bash
# A separate Obsidian for checking the theme in the real app: its own settings folder
# (no Sync login; your everyday Obsidian and vaults are untouched), the same app version
# you run, and a DevTools port (9333) for cdp.mjs. It opens the repo's demo vault.
#   ./launch.sh        start it (first run trusts the vault's plugins automatically)
#   ./launch.sh stop   quit it
# Another vault: point it at a copy, never at a vault your own Obsidian has open (they'd
# fight over workspace.json):  cp -cR ~/vault /tmp/vault-copy (an instant APFS clone),
# then NL_VAULT=/tmp/vault-copy NL_DATA=/tmp/vault-userdata ./launch.sh
HERE="$(cd "$(dirname "$0")" && pwd)"
DATA="${NL_DATA:-$HERE/userdata}"
VAULT="${NL_VAULT:-$(cd "$HERE/../../demo" && pwd)}"
if [ "$1" = stop ]; then pkill -f "user-data-dir=$DATA"; exit 0; fi
mkdir -p "$DATA" "$HERE/shots"
ASAR=$(ls -t "$HOME/Library/Application Support/obsidian/"obsidian-*.asar 2>/dev/null | head -1)
[ -n "$ASAR" ] && cp -n "$ASAR" "$DATA/" 2>/dev/null
[ -f "$DATA/obsidian.json" ] || printf '{"vaults":{"a1b2c3d4e5f60718":{"path":"%s","ts":%s000,"open":true}},"updateDisabled":true}\n' "$VAULT" "$(date +%s)" > "$DATA/obsidian.json"
open -n -a Obsidian --args --user-data-dir="$DATA" --remote-debugging-port=9333 --remote-allow-origins='*'
for i in $(seq 1 30); do curl -s http://127.0.0.1:9333/json/list >/dev/null 2>&1 && break; sleep 1; done
sleep 4
cd "$HERE" && node cdp.mjs eval '(() => { const b = [...document.querySelectorAll(".modal button")].find(b => /Trust author/.test(b.textContent)); if (b) { b.click(); return "plugins trusted"; } return "ready"; })()'
