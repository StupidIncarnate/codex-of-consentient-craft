/**
 * PURPOSE: Zod schema for .agents/skills.json configuration structure
 *
 * USAGE:
 * const config = agentsSkillsConfigContract.parse(data);
 * // Returns validated AgentsSkillsConfig
 */

import { z } from 'zod';

export const agentsSkillsConfigContract = z
  .object({
    entries: z.array(
      z.object({
        path: z.string(),
      }),
    ),
  })
  .brand<'AgentsSkillsConfig'>();

export type AgentsSkillsConfig = z.infer<typeof agentsSkillsConfigContract>;
