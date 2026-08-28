/**
 * PURPOSE: Defines the base command arguments and binary name used when spawning a ward sub-process
 *
 * USAGE:
 * childProcessSpawnStreamAdapter({ command: resolvedBin, args: [...wardSpawnCommandStatics.baseArgs, '--only', 'lint'], cwd });
 * // Spawns '/path/to/dungeonmaster-ward run --only lint'
 */

export const wardSpawnCommandStatics = {
  bin: 'dungeonmaster-ward',
  baseArgs: ['run'] as const,
  // PARENT-TO-CHILD ONLY, and deliberately absent from the flag list a user-facing error prints.
  // A child ward spawned by commandRunLayerMultiBroker is already narrowed to one package —
  // `filteredFolders` picked it — so the "--onlyTests needs a -- <files> scope" rule that protects
  // a human from a full-monorepo sweep has nothing left to protect against, and a whole-package
  // arg (`-- packages/ward`) leaves no per-file list to forward in its place. This flag is how the
  // parent says so; `cliArgsParseTransformer` reads it as a local boolean and never as a
  // WardConfig field, so it stays out of the scope classifications.
  parentScopedFlag: '--parentScoped',
} as const;
