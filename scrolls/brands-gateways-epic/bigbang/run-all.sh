#!/usr/bin/env bash
# Resumable big-bang driver, for any npm-workspaces repo. Runs the brand scripts in place from
# scrolls/brands-gateways-epic/phase34-scripts/, commits each step's output on the current branch (tree red is expected),
# and writes a marker per step to <out>/bigbang/state/<key>; a rerun skips marked steps.
#
#   bash run-all.sh [--root=DIR] [--lists=DIR] [--base=REV] [--out-dir=DIR] [--decisions=FILE] [setting flags] SEGMENT
#
#   A       W1 (w1-runs.txt), SD12, W3 (w3-runs.txt), W4 (w4-runs.txt), W2 (every w2-*.json, in name order)
#   B       W5 trials: the first five lines of w5-runs.txt
#   C       rest of W5, W6 (fallout script, then R2 and R7 autofix, one package per eslint process), W7, W8 --only=json,own
#   D       NEEDS-GREEN: W8 --responders, then W9 (dead re-parses). Run only once typecheck and unit are green
#   W10fix  R2 then R8 autofix over every package's src, one package per eslint process
#
# --root     the repo to migrate (default: cwd). Every git command and every script runs there.
# --lists    folder holding w1-runs.txt, w3-runs.txt, w4-runs.txt, w5-runs.txt and w2-*.json (PORTING.md says how to
#            draft them). Default: this folder, only when --root is the repo holding this script. A missing list skips
#            its wave with a note.
# --base     back-fill markers from commit subjects "<KEY>: ..." in <base>..HEAD, so a run resumes after its own death or
#            after steps committed by hand. Give the commit just before the first step; without --base only the
#            marker files count (older history can hold subjects like "SD12: ..." from other work).
# --out-dir  scratch (default <root>/tmp): logs, markers, leftovers, moved-away files.
# Setting flags pass through to every script as MIGRATE_* variables: --decisions --scope --gateway-dir --gateway-spec
#   --zod-spec --browser-pkgs --eslint-prefix (phase34-scripts/lib/port-config.cjs).
# --lint-src="a b"  paths whose change makes the driver re-load eslint.config.js after the commit (default
#   "packages/eslint-plugin packages/local-eslint": this repo's lint config loads those packages from source).
# COMMIT_TRAILER (env) replaces the default commit trailer.
#
# Refuses to start while packages/ has uncommitted changes (a step died mid-write: the operator sorts it out).
# Ends with <out>/bigbang/<SEG>.done or <SEG>.failed. Progress: <out>/bigbang/logs/<SEG>-progress.log
# Launch detached: setsid nohup bash run-all.sh --root=... SEG > <out>/bigbang/logs/SEG-driver.out 2>&1 < /dev/null &
set -u
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SCRIPTS=$(cd "$HERE/../phase34-scripts" && pwd)
ROOT=$PWD LISTS= BASE= OUTDIR= SEG= LINT_SRC="packages/eslint-plugin packages/local-eslint"
for a in "$@"; do
  case "$a" in
    --root=*) ROOT=${a#*=} ;;
    --lists=*) LISTS=${a#*=} ;;
    --base=*) BASE=${a#*=} ;;
    --out-dir=*) OUTDIR=${a#*=} ;;
    --lint-src=*) LINT_SRC=${a#*=} ;;
    --decisions=*) export MIGRATE_DECISIONS=$(realpath -m "${a#*=}") ;;
    --scope=*) export MIGRATE_SCOPE=${a#*=} ;;
    --gateway-dir=*) export MIGRATE_GATEWAY_DIR=${a#*=} ;;
    --gateway-spec=*) export MIGRATE_GATEWAY_SPEC=${a#*=} ;;
    --zod-spec=*) export MIGRATE_ZOD_SPEC=${a#*=} ;;
    --browser-pkgs=*) export MIGRATE_BROWSER_PKGS=${a#*=} ;;
    --eslint-prefix=*) export MIGRATE_ESLINT_PREFIX=${a#*=} ;;
    --*) echo "unknown flag $a" >&2; exit 2 ;;
    *) SEG=$a ;;
  esac
done
[ -n "$SEG" ] || { echo "segment required: A, B, C, D or W10fix" >&2; exit 2; }
ROOT=$(cd "$ROOT" && pwd) || exit 1
cd "$ROOT" || exit 1
[ -f package.json ] && [ -d packages ] || { echo "$ROOT is not an npm-workspaces repo with packages/" >&2; exit 2; }
OUTDIR=$(realpath -m "${OUTDIR:-$ROOT/tmp}")
export MIGRATE_ROOT=$ROOT MIGRATE_OUT=$OUTDIR
if [ -z "$LISTS" ]; then
  if [ "$ROOT" = "$(cd "$HERE/../../.." && pwd)" ]; then LISTS=$HERE; else echo "--lists=DIR is required for another repo" >&2; exit 2; fi
fi
LISTS=$(cd "$LISTS" && pwd) || exit 1
BB=$OUTDIR/bigbang
L=$BB/logs
S=$BB/state
mkdir -p "$L" "$S"
rm -f "$BB/$SEG.done" "$BB/$SEG.failed"
ATTR=${COMMIT_TRAILER-$'\n\nClaude\'d it up in here!'}

fail() { echo "$*" > "$BB/$SEG.failed"; echo "$(date +%H:%M:%S) FAILED: $*" >> "$L/$SEG-progress.log"; exit 1; }
note() { echo "$(date +%H:%M:%S) $*" >> "$L/$SEG-progress.log"; }
note "root $ROOT lists $LISTS out $OUTDIR"

[ -z "$(git status --porcelain -- packages)" ] || fail "packages/ has uncommitted changes; a step died mid-write. Inspect before resuming."

if [ -n "$BASE" ]; then
  git log --format=%s "$BASE..HEAD" | while IFS= read -r subj; do
    key=${subj%%:*}
    case "$key" in W1\ *|W2\ *|W3\ *|W4\ *|W5\ *|W6\ *|W7|W8|W8R|W9|SD12|W10\ r*) : > "$S/${key// /_}";; esac
  done
fi

done_key() { [ -f "$S/${1// /_}" ]; }
mark() { : > "$S/${1// /_}"; }

lint_loads() {
  node -e "const r=require('module').createRequire(process.cwd()+'/');try{r('tsx/cjs')}catch{};r('./eslint.config.js')" > "$L/lintload.log" 2>&1
}

# $1 key (commit subject prefix), $2 log file, rest: command
step() {
  local key=$1 log=$2; shift 2
  if done_key "$key"; then note "skip (done) $key"; return 0; fi
  note "$key start"
  "$@" </dev/null > "$log" 2>&1 || fail "$key (see $log)"
  git add -A packages
  if git diff --cached --quiet; then note "no change: $key"; mark "$key"; return 0; fi
  local lintpkgs=
  # shellcheck disable=SC2086
  [ -n "$LINT_SRC" ] && lintpkgs=$(git diff --cached --name-only -- $LINT_SRC | head -1)
  git commit -q -m "$key: $STEP_MSG$ATTR" || fail "commit failed: $key"
  mark "$key"
  note "committed $(git log --oneline -1)"
  if [ -n "$lintpkgs" ]; then lint_loads || fail "eslint.config.js no longer loads after: $key (see $L/lintload.log)"; fi
}

need_list() { [ -f "$1" ] || { note "no list $1: wave skipped"; return 1; }; }

w1() {
  need_list "$LISTS/w1-runs.txt" || return 0
  while read -r c f; do
    case "$c" in ''|\#*) continue;; esac
    if [ ! -f "$f" ]; then done_key "W1 $c" || note "W1 skip $c: $f gone"; continue; fi
    STEP_MSG="plain (script output, tree red)" step "W1 $c" "$L/w1-$c.log" \
      node --max-old-space-size=20000 "$SCRIPTS/feasibility/b15/codemod.cjs" --brand="$c" --file="$f" --no-check apply
  done < "$LISTS/w1-runs.txt"
}

w5() { # $1 first run line (1-based), $2 last (0 = to the end)
  need_list "$LISTS/w5-runs.txt" || return 0
  local n=0
  while read -r c f flags; do
    case "$c" in ''|\#*) continue;; esac
    n=$((n + 1))
    [ "$n" -lt "$1" ] && continue
    [ "$2" -ne 0 ] && [ "$n" -gt "$2" ] && break
    if [ ! -f "$f" ]; then done_key "W5 $c" || note "W5 skip $c: $f gone"; continue; fi
    # shellcheck disable=SC2086
    STEP_MSG="derived field brands (script output, tree red)" step "W5 $c" "$L/w5-$c.log" \
      node --max-old-space-size=24000 "$SCRIPTS/b15-value-brands/run.cjs" --brand="$c" --file="$f" $flags apply
  done < "$LISTS/w5-runs.txt"
}

ids() { # $1 chunk, $2 list
  need_list "$2" || return 0
  while read -r args; do
    case "$args" in ''|\#*) continue;; esac
    local tag=${args// /}; tag=${tag//--pkg=/-}
    # shellcheck disable=SC2086
    CHUNK=$1 STEP_MSG="owner id (script output, tree red)" step "$1 $args" "$L/$1-$tag.log" \
      node --max-old-space-size=16000 "$SCRIPTS/b15-id-brands/run.cjs" --brand=$args apply
  done < "$2"
}

# $1 rule (r2|r7|r8), $2 wave label, $3 glob suffix under packages/<pkg>/ (src/contracts or src)
autofix() {
  local r=$1 wave=$2 sub=$3 d p
  for d in packages/*/"$sub"; do
    [ -d "$d" ] || continue
    p=${d#packages/}; p=${p%%/*}
    # one package per eslint process with a 16G heap: one process over every package ran out of memory.
    # eslint exits non-zero while errors remain; the JSON report proves it ran
    STEP_MSG="autofix, contract brands (tree red)" step "$wave $r $p" "$L/${wave,,}-$r-$p.log" \
      bash -c "NODE_OPTIONS=--max-old-space-size=16000 BRAND_FIX_RULES=$r node_modules/.bin/eslint -c '$HERE/brand-fix.config.js' --fix -f json -o '$L/${wave,,}-$r-$p.json' '$d'; test -s '$L/${wave,,}-$r-$p.json'"
  done
}

case "$SEG" in
A)
  w1
  STEP_MSG="R8 parameter retype and its test fallout (script output, tree red)" step "SD12" "$L/sd12.log" \
    node --max-old-space-size=20000 "$SCRIPTS/b13-test-fallout/run.cjs" --leftovers="$L/sd12-leftovers.txt" apply
  export CHUNK
  ids W3 "$LISTS/w3-runs.txt"
  ids W4 "$LISTS/w4-runs.txt"
  for j in "$LISTS"/w2-*.json; do
    [ -f "$j" ] || { note "no w2-*.json in $LISTS: W2 skipped"; break; }
    n=$(basename "$j" .json)
    STEP_MSG="contract renames (script output, tree red)" step "W2 $n" "$L/w2-$n.log" \
      node --max-old-space-size=16000 "$SCRIPTS/b15-rename/rename.cjs" --batch="$j" apply
  done
  ;;
B) w5 1 5 ;;
C)
  w5 6 0
  STEP_MSG="object-brand fallout: contracts branded, literals built through their parse (script output, tree red)" \
    step "W6 fallout" "$L/w6-fallout.log" node --max-old-space-size=40000 "$SCRIPTS/b12-object-brand-fallout/run.cjs" apply
  autofix r2 W6 src/contracts
  autofix r7 W6 src/contracts
  STEP_MSG="ad-hoc shapes become contracts (script output, tree red)" step "W7" "$L/w7.log" \
    node --max-old-space-size=32000 "$SCRIPTS/b14-shape-contracts/run.cjs" apply
  STEP_MSG="z.unknown() fields replaced, json and own rows (script output, tree red)" step "W8" "$L/w8.log" \
    node --max-old-space-size=32000 "$SCRIPTS/b15-unknown-fields/run.cjs" --only=json,own apply
  ;;
D)
  STEP_MSG="responder data contracts (script output)" step "W8R" "$L/w8r.log" \
    node --max-old-space-size=32000 "$SCRIPTS/b15-unknown-fields/run.cjs" --responders apply
  STEP_MSG="dead re-parses removed (script output)" step "W9" "$L/w9.log" \
    node --max-old-space-size=32000 "$SCRIPTS/b15-dead-reparse/run.cjs" apply
  ;;
W10fix)
  autofix r2 W10 src
  autofix r8 W10 src
  ;;
*) fail "unknown segment $SEG" ;;
esac

note "segment $SEG done"
touch "$BB/$SEG.done"
