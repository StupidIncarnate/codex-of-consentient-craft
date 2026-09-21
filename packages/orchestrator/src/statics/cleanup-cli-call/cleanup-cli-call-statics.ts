/**
 * PURPOSE: The argv the cleanup handler spawns — `dungeonmaster siegelense cleanup --json`, routed
 * through `SiegelenseFlow`'s own call table (`siegelense-flow.ts`). `--json` is what makes
 * `SiegelenseCleanupResponder` print the raw `CleanupAnswer` instead of the human table.
 *
 * USAGE:
 * cleanupCliCallStatics.call.bin;
 * // Returns 'dungeonmaster'
 * cleanupCliCallStatics.call.args;
 * // Returns ['siegelense', 'cleanup', '--json']
 */

export const cleanupCliCallStatics = {
  call: {
    bin: 'dungeonmaster',
    args: ['siegelense', 'cleanup', '--json'],
  },
} as const;
