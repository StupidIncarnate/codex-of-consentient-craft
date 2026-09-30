#!/usr/bin/env bash
# Resumable big-bang driver. Every step writes tmp/bigbang/state/<key> after its commit; a rerun skips marked steps.
# On start it back-fills markers from git log commit subjects, so it resumes after run-a.sh or after its own death.
#   bash run-all.sh A   -> W1, SD12, W3, W4, W2
#   bash run-all.sh B   -> W5 trials (first five run lines)
#   bash run-all.sh C   -> rest of W5, W6 (fallout, R2, R7), W7, W8 --only=json,own
# Refuses to start while packages/ has uncommitted changes (a step died mid-write: the operator sorts it out).
# Ends with tmp/bigbang/<SEG>.done or tmp/bigbang/<SEG>.failed. Progress: tmp/bigbang/logs/<SEG>-progress.log
set -u
SEG=${1:?A, B or C}
cd /home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot || exit 1
B=scrolls/brands-gateways-epic/bigbang
L=tmp/bigbang/logs
S=tmp/bigbang/state
mkdir -p "$L" "$S"
rm -f "tmp/bigbang/$SEG.done" "tmp/bigbang/$SEG.failed"
ATTR=$'\n\nClaude\'d it up in here!'

fail() { echo "$*" > "tmp/bigbang/$SEG.failed"; echo "$(date +%H:%M:%S) FAILED: $*" >> "$L/$SEG-progress.log"; exit 1; }
note() { echo "$(date +%H:%M:%S) $*" >> "$L/$SEG-progress.log"; }

[ -z "$(git status --porcelain -- packages)" ] || fail "packages/ has uncommitted changes; a step died mid-write. Inspect before resuming."

# back-fill markers from commit subjects: "<KEY>: ..." where KEY is everything before the first colon
# only commits after the big-bang prep commit: older history has subjects like "SD12: ..." from earlier work
git log --format=%s c2cbc43d4..HEAD | while IFS= read -r subj; do
  key=${subj%%:*}
  case "$key" in W1\ *|W2\ *|W3\ *|W4\ *|W5\ *|W6\ *|W7|W8|SD12) : > "$S/${key// /_}";; esac
done

done_key() { [ -f "$S/${1// /_}" ]; }
mark() { : > "$S/${1// /_}"; }

# $1 key (commit subject prefix), $2 log file, rest: command
step() {
  local key=$1 log=$2; shift 2
  if done_key "$key"; then note "skip (done) $key"; return 0; fi
  note "$key start"
  "$@" </dev/null > "$log" 2>&1 || fail "$key (see $log)"
  git add -A packages
  if git diff --cached --quiet; then note "no change: $key"; mark "$key"; return 0; fi
  local lintpkgs
  lintpkgs=$(git diff --cached --name-only -- packages/eslint-plugin packages/local-eslint | head -1)
  git commit -q -m "$key: $STEP_MSG$ATTR" || fail "commit failed: $key"
  mark "$key"
  note "committed $(git log --oneline -1)"
  if [ -n "$lintpkgs" ]; then
    node -e "require('tsx/cjs'); require('./eslint.config.js')" > "$L/lintload.log" 2>&1 || fail "eslint.config.js no longer loads after: $key (see $L/lintload.log)"
  fi
}

w5() { # $1 first run line (1-based), $2 last (0 = to the end)
  local n=0
  while read -r c f flags; do
    case "$c" in ''|\#*) continue;; esac
    n=$((n + 1))
    [ "$n" -lt "$1" ] && continue
    [ "$2" -ne 0 ] && [ "$n" -gt "$2" ] && break
    if [ ! -f "$f" ]; then done_key "W5 $c" || note "W5 skip $c: $f gone"; continue; fi
    # shellcheck disable=SC2086
    STEP_MSG="derived field brands (script output, tree red)" step "W5 $c" "$L/w5-$c.log" \
      node --max-old-space-size=24000 tmp/phase34/b15-value-brands/run.cjs --brand="$c" --file="$f" $flags apply
  done < "$B/w5-runs.txt"
}

ids() { # $1 chunk, $2 list
  while read -r args; do
    case "$args" in ''|\#*) continue;; esac
    local tag=${args// /}; tag=${tag//--pkg=/-}
    # shellcheck disable=SC2086
    CHUNK=$1 STEP_MSG="owner id (script output, tree red)" step "$1 $args" "$L/$1-$tag.log" \
      node --max-old-space-size=16000 tmp/phase34/b15-id-brands/run.cjs --brand=$args apply
  done < "$2"
}

case "$SEG" in
A)
  while read -r c f; do
    case "$c" in ''|\#*) continue;; esac
    if [ ! -f "$f" ]; then done_key "W1 $c" || note "W1 skip $c: $f gone"; continue; fi
    STEP_MSG="plain (script output, tree red)" step "W1 $c" "$L/w1-$c.log" \
      node --max-old-space-size=20000 tmp/phase34-feasibility/b15/codemod.cjs --brand="$c" --file="$f" --no-check apply
  done < "$B/w1-runs.txt"
  STEP_MSG="R8 parameter retype and its test fallout (script output, tree red)" step "SD12" "$L/sd12.log" \
    node --max-old-space-size=20000 tmp/phase34/b13-test-fallout/run.cjs --leftovers="$L/sd12-leftovers.txt" apply
  export CHUNK
  ids W3 "$B/w3-runs.txt"
  ids W4 "$B/w4-runs.txt"
  for j in w2-renames w2-renames-ward; do
    STEP_MSG="contract renames (script output, tree red)" step "W2 $j" "$L/w2-$j.log" \
      node --max-old-space-size=16000 tmp/phase34/b15-rename/rename.cjs --batch="$B/$j.json" apply
  done
  ;;
B) w5 1 5 ;;
C)
  w5 6 0
  STEP_MSG="object-brand fallout: contracts branded, literals built through their parse (script output, tree red)" \
    step "W6 fallout" "$L/w6-fallout.log" node --max-old-space-size=40000 tmp/phase34/b12-object-brand-fallout/run.cjs apply
  for r in r2 r7; do
    # eslint exits non-zero while errors remain; the JSON report proves it ran
    STEP_MSG="autofix, contract brands (tree red)" step "W6 $r" "$L/w6-$r.log" \
      bash -c "BRAND_FIX_RULES=$r node_modules/.bin/eslint -c $B/brand-fix.config.js --fix -f json -o $L/w6-$r.json packages/*/src/contracts; test -s $L/w6-$r.json"
  done
  STEP_MSG="ad-hoc shapes become contracts (script output, tree red)" step "W7" "$L/w7.log" \
    node --max-old-space-size=32000 tmp/phase34/b14-shape-contracts/run.cjs apply
  STEP_MSG="z.unknown() fields replaced, json and own rows (script output, tree red)" step "W8" "$L/w8.log" \
    node --max-old-space-size=32000 tmp/phase34/b15-unknown-fields/run.cjs --only=json,own apply
  ;;
*) fail "unknown segment $SEG" ;;
esac

note "segment $SEG done"
touch "tmp/bigbang/$SEG.done"
