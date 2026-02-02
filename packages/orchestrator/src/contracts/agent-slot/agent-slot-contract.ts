/**
 * PURPOSE: Defines the structure of an agent slot for tracking concurrent agent processes
 *
 * USAGE:
 * agentSlotContract.parse({stepId: 'uuid', sessionId: 'session-1', process: killableProcess, startedAt: '2024-01-01T00:00:00Z'});
 * // Returns: AgentSlot object
 */

import { z } from 'zod';

import { killableProcessContract } from '../killable-process/killable-process-contract';

export const agentSlotContract = z.object({
  stepId: z.string().uuid().brand<'StepId'>(),
  sessionId: z.string().brand<'SessionId'>(),
  process: killableProcessContract,
  startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type AgentSlot = z.infer<typeof agentSlotContract>;
