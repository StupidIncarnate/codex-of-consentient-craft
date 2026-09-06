#!/usr/bin/env bash
# Scoped kill for `npm run dev` / `npm run prod` runners.
#
# Why this exists: a port-only kill (lsof -ti :PORT | xargs kill) leaves stale
# `npm run dev` parent shells, tsx-watch, and vite workers alive whenever a previous
# server crashed before binding the port. Each fresh `npm run dev` then piles a NEW
# process tree on top of the orphans, producing WS churn and surprising race
# conditions during QA loops. We need a kill that is BOTH:
#   1. broad enough to reap orphans whose port has already been released, AND
#   2. narrow enough to leave dev servers in OTHER repos (e.g. amalga-victorious)
#      completely untouched.
#
# Strategy:
#   1. Port sweep — kill whatever LISTENS on our mode's ports FROM INSIDE REPO_ROOT.
#      Matching listeners only keeps processes that merely hold a connection to the port
#      out of the blast radius: `lsof -ti :PORT` also reports clients, so an open browser
#      tab pointed at the dev server makes Chrome's network process a match. The cwd test
#      is what keeps it repo-scoped — a port number alone is not ownership, and two
#      checkouts whose `.dungeonmaster.json` files agree collide on it.
#   2. cwd sweep — for every node/tsx/vite candidate, read /proc/<pid>/cwd. If it is
#      inside REPO_ROOT, classify it by mode and kill it only when it belongs to the
#      mode being restarted. Other repos' processes have a cwd outside REPO_ROOT, so
#      they are skipped.
#
# Mode scoping: dev and prod run from the same cwd, so cwd alone cannot tell them
# apart. Two signals do, in this order — argv for launcher shells (they name the
# script they run), then DUNGEONMASTER_HOME for the leaf servers (`npm run dev`
# exports <repo>/.dungeonmaster-dev, `npm run prod` exports <repo>/.dungeonmaster,
# and every tsx/vite/esbuild child inherits it). This matters during a dogfood siege:
# the quest's siegemaster runs `npm run dev` as a child of the prod server, so an
# unscoped sweep takes down the prod stack that is driving the quest, and an
# env-only sweep misreads the siege's dev launchers as prod. A process carrying some
# other home — a Playwright e2e server on /tmp/dm-e2e-* — is left alone.
#
# Self-protection: this script is a child of `npm run dev` (or `npm run prod`).
# Killing its own pid or any ancestor would suicide the launcher. We walk up the
# /proc/<pid>/status `PPid:` chain and skip every ancestor.
#
# Linux-only — relies on /proc. dev:kill / prod:kill on macOS/Windows would need
# a different cwd lookup (lsof -p <pid> | grep cwd). Out of scope here.

set -u

MODE="${1:-}"
DRY_RUN=0
case "${2:-}" in
  --dry-run) DRY_RUN=1 ;;
esac

if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
  echo "Usage: scripts/scoped-kill.sh <dev|prod> [--dry-run]" >&2
  exit 2
fi

do_kill() {
  if [ "$DRY_RUN" -eq 1 ]; then
    return 0
  fi
  kill -9 "$1" 2>/dev/null
}

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"

if [ "$MODE" = "dev" ]; then
  PORT="$(node -e 'process.stdout.write(String(require("./.dungeonmaster.json").devServer.port))')"
  EXPECTED_HOME="$REPO_ROOT/.dungeonmaster-dev"
else
  PORT="$(node -e 'const c = require("./.dungeonmaster.json"); process.stdout.write(String(c.dungeonmaster && c.dungeonmaster.port ? c.dungeonmaster.port : 3737))')"
  EXPECTED_HOME="$REPO_ROOT/.dungeonmaster"
fi

PORTS="$PORT $((PORT + 1))"

# Build the safe pid set: $$ and every ancestor up the PPid chain.
SAFE_PIDS=" $$"
ANC="$PPID"
while [ -n "$ANC" ] && [ "$ANC" != "0" ] && [ "$ANC" != "1" ]; do
  SAFE_PIDS="$SAFE_PIDS $ANC"
  ANC="$(awk '/^PPid:/ { print $2 }' /proc/"$ANC"/status 2>/dev/null || true)"
done

is_safe() {
  case "$SAFE_PIDS" in
    *" $1 "* | *" $1") return 0 ;;
  esac
  return 1
}

# True when a pid's cwd is inside REPO_ROOT. BOTH sweeps need it. For the cwd sweep it is
# the whole filter; for the port sweep it is what makes the sweep repo-scoped at all — a
# port number is not ownership, and two checkouts of this repo pick colliding ports the
# moment their `.dungeonmaster.json` files agree (at install defaults prod sweeps
# 3737/3738 and dev sweeps 3738/3739, so the two overlap on 3738 within ONE repo too).
# An unreadable /proc entry returns false and the pid is spared: it belongs to another
# user, so it was never ours to kill.
is_repo_cwd() {
  irc_cwd="$(readlink "/proc/$1/cwd" 2>/dev/null || true)"
  [ -n "$irc_cwd" ] || return 1
  case "$irc_cwd" in
    "$REPO_ROOT" | "$REPO_ROOT"/*) return 0 ;;
  esac
  return 1
}

# Classify a pid against MODE. Echoes one of:
#   match   — belongs to the mode being restarted; kill it
#   other   — belongs to the other mode, or to an unrelated DUNGEONMASTER_HOME; spare it
#   unknown — not attributable; spare it
#
# DUNGEONMASTER_HOME is compared with `=`, never a prefix test: ".dungeonmaster" is a
# prefix of ".dungeonmaster-dev", so a prefix match would fold dev into prod.
pid_mode() {
  pm_dir="/proc/$1"
  pm_cmdline="$2"

  # argv wins for the launcher npm/sh shells, which name the script they run. A shell
  # running `npm run dev` is a dev process even when it inherited prod's
  # DUNGEONMASTER_HOME from whatever spawned it — exactly the case during a dogfood
  # siege, where the siegemaster starts a dev server from inside the prod stack.
  #
  # A `--workspace=` invocation is NEVER a root launcher, and it MUST fall through to the
  # env test below. `npm run dev` is a prefix of `npm run dev:no-watch`, so the arm below
  # matched the Playwright e2e API server (`npm run dev:no-watch --workspace=@dungeonmaster/server`,
  # playwright.config.ts) and its Vite half — and returned `match` for MODE=dev before the
  # DUNGEONMASTER_HOME test could read `/tmp/dm-e2e-*` and spare them. Typing `npm run dev`
  # here then killed an in-flight ward e2e run, which surfaced as
  # `Timed out waiting 60000ms from config.webServer` in a run nobody had touched.
  #
  # Falling through costs the root launcher's own workspace children nothing: they inherit
  # DUNGEONMASTER_HOME from it (`<repo>/.dungeonmaster-dev`), so the env test still calls
  # them `match`. An e2e child carries `/tmp/dm-e2e-<pid>` and reads `other`; a child with no
  # home at all reads `unknown`. Both are spared, which is the safe direction.
  case "$pm_cmdline" in
    *--workspace*) ;;
    *"npm run dev"*|*".dungeonmaster-dev"*)
      if [ "$MODE" = "dev" ]; then echo match; else echo other; fi
      return 0
      ;;
    *"npm run prod"*|*"npm run preview"*)
      if [ "$MODE" = "prod" ]; then echo match; else echo other; fi
      return 0
      ;;
  esac

  # Leaf processes — tsx, vite, esbuild, server-entry — carry no mode marker in argv.
  # They do inherit DUNGEONMASTER_HOME from the launcher that exported it.
  pm_home=""
  if [ -r "$pm_dir/environ" ]; then
    pm_home="$(tr '\0' '\n' < "$pm_dir/environ" 2>/dev/null |
      awk '/^DUNGEONMASTER_HOME=/ { print substr($0, index($0, "=") + 1); exit }')"
  fi

  if [ -n "$pm_home" ]; then
    if [ "$pm_home" = "$EXPECTED_HOME" ]; then echo match; else echo other; fi
    return 0
  fi

  echo unknown
}

PORT_KILLED=""
for p in $PORTS; do
  pids="$(lsof -ti "tcp:$p" -sTCP:LISTEN 2>/dev/null || true)"
  for pid in $pids; do
    if is_safe "$pid"; then continue; fi
    if ! is_repo_cwd "$pid"; then continue; fi
    if do_kill "$pid"; then
      PORT_KILLED="$PORT_KILLED $pid"
    fi
  done
done

CWD_KILLED=""
if [ -d /proc ]; then
  # Read every /proc/<pid> in a single pass. Faster + more reliable than pgrep,
  # and avoids missing processes whose argv[0] was rewritten.
  for pid_dir in /proc/[0-9]*; do
    pid="${pid_dir##*/}"
    if is_safe "$pid"; then continue; fi

    cmdline_file="$pid_dir/cmdline"
    [ -r "$cmdline_file" ] || continue

    # /proc/.../cmdline uses NUL separators; substitute spaces for grep.
    cmdline="$(tr '\0' ' ' < "$cmdline_file" 2>/dev/null || true)"

    # Narrow to dev/runtime processes before reading cwd. Adjust this list when adding
    # new dev tooling. The launcher npm process is also matched here, but its cwd is
    # REPO_ROOT and it's the (possibly orphan) parent shell we want to reap.
    case "$cmdline" in
      *tsx*|*vite*|*esbuild*|*"@dungeonmaster/server"*|*"@dungeonmaster/web"*|*"npm run dev"*|*"npm run prod"*|*"server-entry"*) ;;
      *) continue ;;
    esac

    if ! is_repo_cwd "$pid"; then continue; fi

    [ "$(pid_mode "$pid" "$cmdline")" = "match" ] || continue

    if do_kill "$pid"; then
      CWD_KILLED="$CWD_KILLED $pid"
    fi
  done
fi

PORT_KILLED="${PORT_KILLED# }"
CWD_KILLED="${CWD_KILLED# }"
DRY_LABEL=""
if [ "$DRY_RUN" -eq 1 ]; then DRY_LABEL=" [dry-run]"; fi
echo "$MODE:kill$DRY_LABEL — repo=$REPO_ROOT ports=$PORTS port-killed=[$PORT_KILLED] cwd-killed=[$CWD_KILLED]"
