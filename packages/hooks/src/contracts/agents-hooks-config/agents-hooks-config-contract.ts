/**
 * PURPOSE: Zod schema for .agents/hooks.json configuration structure
 *
 * USAGE:
 * const config = agentsHooksConfigContract.parse(data);
 * // Returns validated AgentsHooksConfig
 */

import { z } from '#gateway/npm/zod';

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
            }).brand<'AgentsHooksConfigDungeonmasterGuardPreToolUseHooks'>(),
          ),
        }).brand<'AgentsHooksConfigDungeonmasterGuardPreToolUse'>(),
      ),
      Stop: z.array(
        z.object({
          type: z.literal('command'),
          command: z.string(),
        }).brand<'AgentsHooksConfigDungeonmasterGuardStop'>(),
      ),
    }).brand<'AgentsHooksConfigDungeonmasterGuard'>(),
  })
  .brand<'AgentsHooksConfig'>();

export type AgentsHooksConfig = z.infer<typeof agentsHooksConfigContract>;
