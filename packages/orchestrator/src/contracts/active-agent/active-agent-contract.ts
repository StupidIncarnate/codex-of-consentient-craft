/**
 * PURPOSE: Defines the structure of an active agent being orchestrated
 *
 * USAGE:
 * const agent: ActiveAgent = { slotIndex, workItemId, sessionId, followupDepth, promise };
 * // Tracks an agent running in an orchestration slot
 */

import { z } from 'zod';

import { sessionIdContract } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingResultContract } from '../agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { followupDepthContract } from '../followup-depth/followup-depth-contract';
import { slotIndexContract } from '../slot-index/slot-index-contract';
import { workItemIdContract } from '../work-item-id/work-item-id-contract';

export const activeAgentContract = z.object({
  slotIndex: slotIndexContract,
  workItemId: workItemIdContract,
  sessionId: sessionIdContract.nullable(),
  followupDepth: followupDepthContract.default(0),
  promise: z.promise(agentSpawnStreamingResultContract),
});

export type ActiveAgent = z.infer<typeof activeAgentContract>;
