/**
 * PURPOSE: Zod schema for .agents/hooks.json configuration structure
 *
 * USAGE:
 * const config = agentsHooksConfigContract.parse(data);
 * // Returns validated AgentsHooksConfig
 */

import { z } from 'zod';

export const agentsHooksConfigContract = z
  .object({
    'dungeonmaster-guard': z.object({
      PreToolUse: z.array(
        z.object({
          matcher: z.string(),
          hooks: z.array(
            z.object({
              type: z.literal('command'),
              command: z.string(),
            }),
          ),
        }),
      ),
      Stop: z.array(
        z.object({
          type: z.literal('command'),
          command: z.string(),
        }),
      ),
    }),
  })
  .brand<'AgentsHooksConfig'>();

export type AgentsHooksConfig = z.infer<typeof agentsHooksConfigContract>;
