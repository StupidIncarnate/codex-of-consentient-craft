/**
 * PURPOSE: Defines the agent object whose `id` every contract and function that holds one reuses
 *
 * USAGE:
 * agentContract.parse({ id: 'agent-abc' });
 * // Returns: Agent object
 */

import { z } from '#gateway/npm/zod';

export const agentContract = z
  .object({
    id: z.string().min(1).brand<'AgentId'>(),
  })
  .brand<'Agent'>();

export type Agent = z.infer<typeof agentContract>;
