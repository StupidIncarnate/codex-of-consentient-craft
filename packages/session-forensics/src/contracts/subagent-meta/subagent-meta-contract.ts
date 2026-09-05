/**
 * PURPOSE: The `.meta.json` file Claude Code writes beside every sub-agent transcript. Reach for
 * this instead of parsing the transcript itself when you need the agent type, the model the
 * parent chose, or how deep in the spawn tree this agent sat. The transcript JSONL never records
 * any of those three.
 *
 * USAGE:
 * subagentMetaContract.parse({
 *   agentType: 'general-purpose', description: 'Add pasted-image upload contract',
 *   toolUseId: 'toolu_013MwHATQFcXS5tJjdhV8YMP', spawnDepth: 1, model: 'sonnet',
 * });
 */
import { z } from 'zod';

export const subagentMetaContract = z
  .object({
    agentType: z.string().min(1),
    description: z.string().min(1),
    toolUseId: z.string().min(1),
    spawnDepth: z.number().int().nonnegative(),
    model: z.string().min(1).optional(),
  })
  .brand<'SubagentMeta'>();

export type SubagentMeta = z.infer<typeof subagentMetaContract>;
