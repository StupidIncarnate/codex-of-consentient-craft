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
} as const;
