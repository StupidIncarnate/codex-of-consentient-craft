/**
 * PURPOSE: Defines the structure of an active agent being orchestrated
 *
 * USAGE:
 * const agent: ActiveAgent = { slotIndex, stepId, sessionId, promise };
 * // Tracks an agent running in an orchestration slot
 */

import { z } from 'zod';

import { sessionIdContract, stepIdContract } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingResultContract } from '../agent-spawn-streaming-result/agent-spawn-streaming-result-contract';
import { slotIndexContract } from '../slot-index/slot-index-contract';

export const activeAgentContract = z.object({
  slotIndex: slotIndexContract,
  stepId: stepIdContract,
  sessionId: sessionIdContract.nullable(),
  promise: z.promise(agentSpawnStreamingResultContract),
});

export type ActiveAgent = z.infer<typeof activeAgentContract>;
