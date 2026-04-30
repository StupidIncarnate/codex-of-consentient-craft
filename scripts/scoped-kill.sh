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
#   1. Port sweep — kill anything bound to our dev/prod ports (always ours).
#   2. cwd sweep — for every node/tsx/vite candidate, read /proc/<pid>/cwd. If it
#      is inside REPO_ROOT, kill it. Other repos' processes have a cwd outside
#      REPO_ROOT, so they are skipped.
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
else
  PORT="$(node -e 'const c = require("./.dungeonmaster.json"); process.stdout.write(String(c.dungeonmaster && c.dungeonmaster.port ? c.dungeonmaster.port : 3737))')"
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

PORT_KILLED=""
for p in $PORTS; do
  pids="$(lsof -ti ":$p" 2>/dev/null || true)"
  for pid in $pids; do
    if is_safe "$pid"; then continue; fi
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

    cwd="$(readlink "$pid_dir/cwd" 2>/dev/null || true)"
    [ -n "$cwd" ] || continue

    case "$cwd" in
      "$REPO_ROOT"|"$REPO_ROOT"/*) ;;
      *) continue ;;
    esac

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
