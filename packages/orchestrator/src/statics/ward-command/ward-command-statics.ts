/**
 * PURPOSE: The ward binary name and the argument list a carve verifies a worktree with, in one place
 * so the spawn site and any test asserting it read the same values. `typecheckArgs` is the narrowest
 * ward run there is: it compiles every package from the tree's OWN source and runs no test, which is
 * what a freshly carved workspace needs proved before any agent is dispatched into it.
 *
 * USAGE:
 * wardCommandStatics.bin;
 * // Returns 'dungeonmaster-ward'
 *
 * wardCommandStatics.typecheckArgs;
 * // Returns ['run', '--only', 'typecheck']
 */

export const wardCommandStatics = {
  bin: 'dungeonmaster-ward',
  typecheckArgs: ['run', '--only', 'typecheck'],
} as const;
