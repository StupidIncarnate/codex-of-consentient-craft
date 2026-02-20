/**
 * PURPOSE: Defines the base command arguments used when spawning a ward sub-process
 *
 * USAGE:
 * childProcessSpawnCaptureAdapter({ command: 'npx', args: [...wardSpawnCommandStatics.baseArgs, '--only', 'lint'], cwd });
 * // Spawns 'npx dungeonmaster-ward run --only lint'
 */

export const wardSpawnCommandStatics = {
  baseArgs: ['dungeonmaster-ward', 'run'] as const,
} as const;
