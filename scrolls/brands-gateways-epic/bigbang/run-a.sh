#!/usr/bin/env bash
# Segment A of the big-bang run: W1 -> SD12 -> W3 -> W4 -> W2. One script process at a time.
# Commits every run's output (tree red is expected). Stops on the first script failure or lint-config break.
# Writes tmp/bigbang/A.done (success) or tmp/bigbang/A.failed (with the reason) when it ends.
set -u
cd /home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot || exit 1
B=scrolls/brands-gateways-epic/bigbang
L=tmp/bigbang/logs
mkdir -p "$L"
rm -f tmp/bigbang/A.done tmp/bigbang/A.failed
ATTR=$'\n\nClaude\'d it up in here!'

fail() { echo "$*" > tmp/bigbang/A.failed; echo "FAILED: $*" >> "$L/A-progress.log"; exit 1; }
note() { echo "$(date +%H:%M:%S) $*" >> "$L/A-progress.log"; }

commit() {
  git add -A packages
  if git diff --cached --quiet; then note "no change: $1"; return 0; fi
  local lintpkgs
  lintpkgs=$(git diff --cached --name-only -- packages/eslint-plugin packages/local-eslint | head -1)
  git commit -q -m "$1${ATTR}" || fail "commit failed: $1"
  note "committed $(git log --oneline -1)"
  if [ -n "$lintpkgs" ]; then
    node -e "require('tsx/cjs'); require('./eslint.config.js')" > "$L/lintload.log" 2>&1 || fail "eslint.config.js no longer loads after: $1 (see $L/lintload.log)"
  fi
}

# ---- W1 ----
while read -r c f; do
  case "$c" in ''|\#*) continue;; esac
  [ -f "$f" ] || { note "W1 skip $c: $f gone"; continue; }
  note "W1 $c start"
  node --max-old-space-size=20000 tmp/phase34-feasibility/b15/codemod.cjs --brand="$c" --file="$f" --no-check apply </dev/null > "$L/w1-$c.log" 2>&1 || fail "W1 $c (see $L/w1-$c.log)"
  commit "W1 $c: plain (script output, tree red)"
done < "$B/w1-runs.txt"

# ---- SD12 ----
note "SD12 start"
node --max-old-space-size=20000 tmp/phase34/b13-test-fallout/run.cjs --leftovers="$L/sd12-leftovers.txt" apply </dev/null > "$L/sd12.log" 2>&1 || fail "SD12 (see $L/sd12.log)"
commit "SD12: R8 parameter retype and its test fallout (script output, tree red)"

# ---- W3, W4 ----
run_ids() { # $1 chunk, $2 list
  while read -r args; do
    case "$args" in ''|\#*) continue;; esac
    local name=${args%% *}; local tag=${args// /}; tag=${tag//--pkg=/-}
    note "$1 $args start"
    # shellcheck disable=SC2086
    CHUNK=$1 node --max-old-space-size=16000 tmp/phase34/b15-id-brands/run.cjs --brand=$args apply </dev/null > "$L/$1-$tag.log" 2>&1 || fail "$1 $args (see $L/$1-$tag.log)"
    commit "$1 $args: owner id (script output, tree red)"
  done < "$2"
}
run_ids W3 "$B/w3-runs.txt"
run_ids W4 "$B/w4-runs.txt"

# ---- W2 renames ----
for j in w2-renames w2-renames-ward; do
  note "W2 $j start"
  node --max-old-space-size=16000 tmp/phase34/b15-rename/rename.cjs --batch="$B/$j.json" apply </dev/null > "$L/w2-$j.log" 2>&1 || fail "W2 $j (see $L/w2-$j.log)"
  commit "W2 $j: contract renames (script output, tree red)"
done

note "segment A done"
touch tmp/bigbang/A.done
