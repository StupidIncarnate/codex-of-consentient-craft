/**
 * PURPOSE: A single on-disk sub-agent JSONL file as read during chat replay — its realAgentId
 * (the `subagents/agent-<id>.jsonl` filename) paired with the raw JSONL lines it holds. Used to
 * scope a per-work-item replay to a sub-agent AND the nested sub-agents it spawned.
 *
 * USAGE:
 * subagentFileContract.parse({ agentId, lines });
 * // Returns { agentId: AgentId, lines: StreamJsonLine[] }
 */

import { z } from 'zod';

import { streamJsonLineContract } from '@dungeonmaster/shared/contracts';

import { agentIdContract } from '../agent-id/agent-id-contract';

export const subagentFileContract = z.object({
  agentId: agentIdContract,
  lines: z.array(streamJsonLineContract),
});

export type SubagentFile = z.infer<typeof subagentFileContract>;
