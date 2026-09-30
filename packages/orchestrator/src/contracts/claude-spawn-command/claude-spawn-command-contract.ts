/**
 * PURPOSE: The argv and environment a headless `claude -p` child is spawned with. One value, so
 * the two halves that must agree (`--model` with `ENABLE_TOOL_SEARCH`, for one) travel together
 * from the transformer that decides them to the spawn that uses them.
 *
 * USAGE:
 * const { args, env } = claudeSpawnCommandContract.parse({ args: ['-p', 'hi'], env: { PATH: '/usr/bin' } });
 * // Returns a branded ClaudeSpawnCommand
 */

import { z } from '#gateway/npm/zod';

export const claudeSpawnCommandContract = z
  .object({
    args: z.array(z.string().brand<'ClaudeSpawnCommandArgs'>()),
    env: z.record(z.string(), z.string().brand<'ClaudeSpawnCommandEnv'>()),
  })
  .brand<'ClaudeSpawnCommand'>();

export type ClaudeSpawnCommand = z.infer<typeof claudeSpawnCommandContract>;
