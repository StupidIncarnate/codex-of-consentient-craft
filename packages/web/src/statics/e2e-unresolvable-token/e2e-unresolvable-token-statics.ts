/**
 * PURPOSE: The `devServer.e2e.processes[].command`/`.env` placeholder tokens this repo's own
 * `playwright.config.ts` cannot resolve — it has no `laneWorkspaceResolveBroker` of its own, unlike
 * a siegelense lane, which does resolve `{apiWorkspace}`/`{webWorkspace}` off disk. A configured
 * value using either refuses loudly instead of spawning a command carrying the unexpanded text.
 *
 * USAGE:
 * e2eUnresolvableTokenStatics.tokens.all;
 * // Returns ['{apiWorkspace}', '{webWorkspace}']
 */

export const e2eUnresolvableTokenStatics = {
  tokens: {
    all: ['{apiWorkspace}', '{webWorkspace}'],
  },
} as const;
