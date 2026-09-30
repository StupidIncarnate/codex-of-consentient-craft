/**
 * PURPOSE: The root `postinstall` script `dungeonmaster init` writes, and how `dungeonmaster
 * gateway-sync` recognises that npm started it. The script runs the sync only when the
 * `dungeonmaster` binary is on PATH, so an install that leaves devDependencies out (`npm ci
 * --omit=dev`) skips it rather than failing on a missing command, while a sync that does run and
 * fails still fails the install. npm runs scripts under `sh` on POSIX. `marker` is what an existing
 * `postinstall` must mention to count as already running the sync.
 *
 * USAGE:
 * rootPostinstallStatics.script;
 * // Returns 'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi'
 */

export const rootPostinstallStatics = {
  scriptKey: 'postinstall',
  script: 'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
  marker: 'gateway-sync',
  lifecycle: {
    envName: 'npm_lifecycle_event',
    postinstallValue: 'postinstall',
  },
} as const;
