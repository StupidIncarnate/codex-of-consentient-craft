/**
 * PURPOSE: Defines the base command arguments used when spawning a child ward, and the fallback binary
 * name for a parent not started from a compiled entry script
 *
 * USAGE:
 * stream({ command: execPath, args: [selfEntry, ...wardSpawnCommandStatics.baseArgs, '--only', 'lint'], cwd });
 * // Spawns '/usr/bin/node /path/to/ward-entry.js run --only lint'
 */

export const wardSpawnCommandStatics = {
  bin: 'dungeonmaster-ward',
  // A parent started from a compiled entry script spawns its children as `<node> <that script>`.
  entryScriptExtension: '.js',
  baseArgs: ['run'] as const,
  // PARENT-TO-CHILD ONLY, and deliberately absent from the flag list a user-facing error prints.
  // A child ward spawned by multiPackageLayerBroker is already narrowed to one package —
  // `filteredFolders` picked it — so the "--onlyTests needs a -- <files> scope" rule that protects
  // a human from a full-monorepo sweep has nothing left to protect against, and a whole-package
  // arg (`-- packages/ward`) leaves no per-file list to forward in its place. This flag is how the
  // parent says so; `cliArgsParseTransformer` reads it as a local boolean and never as a
  // WardConfig field, so it stays out of the scope classifications.
  parentScopedFlag: '--parentScoped',
  // PARENT-TO-CHILD ONLY, and deliberately absent from the flag list a user-facing error prints.
  // The parent calculates each child's Jest worker share as a percentage of cores based on live
  // concurrency, replacing the fixed 25% default. `cliArgsParseTransformer` reads it as a local
  // number and never as a WardConfig field.
  jestWorkersFlag: '--jestWorkers',
} as const;
