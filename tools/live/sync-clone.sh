#!/bin/bash
# sync-clone.sh <vault> <clone>: bring a cloned vault (see launch.sh) up to date with the
# vault it was copied from, keeping the clone's own workspace, then reload the theme in the
# running test instance. Dataview views re-read their files on the next render.
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "${1:?usage: sync-clone.sh <vault> <clone>}" && pwd)"
DST="${2:?usage: sync-clone.sh <vault> <clone>}"
rsync -a --delete --exclude '.obsidian/workspace*.json' --exclude '.trash/' "$SRC/" "$DST/"
"$HERE/reload-theme.sh"
