/**
 * PURPOSE: Discriminated union returned by quest-get-next-step-broker telling the /dumpster-launch loop what to do next
 *
 * USAGE:
 * nextStepContract.parse({ type: 'idle' });
 * nextStepContract.parse({ type: 'spawn-agents', agents: [SpawnInstruction, ...] });
 * nextStepContract.parse({ type: 'run-ward', questId, workItemId, mode: 'committed' });
 * nextStepContract.parse({ type: 'run-riftcarver', questId, workItemId });
 * // Returns: NextStep variant
 */

import { z } from 'zod';

import {
  questIdContract,
  questWorkItemIdContract,
  wardModeContract,
} from '@dungeonmaster/shared/contracts';

import { idleReasonContract } from '../idle-reason/idle-reason-contract';
import { spawnInstructionContract } from '../spawn-instruction/spawn-instruction-contract';

export const nextStepContract = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('spawn-agents'),
    agents: z.array(spawnInstructionContract),
  }),
  z.object({
    type: z.literal('run-ward'),
    questId: questIdContract,
    workItemId: questWorkItemIdContract,
    mode: wardModeContract,
  }),
  z.object({
    // The other command role. It carries no mode: ward grades a tree that already exists and needs
    // to be told which slice, where a carve has exactly one job and reads its own scope off the
    // quest.
    type: z.literal('run-riftcarver'),
    questId: questIdContract,
    workItemId: questWorkItemIdContract,
  }),
  z.object({
    type: z.literal('idle'),
    // Set when idle is forced rather than organic — the Node dispatcher owns the queue, or the
    // rate-limit guardrail is holding it — so /dumpster-launch's poll is told why nothing will be
    // returned instead of polling on.
    reason: idleReasonContract.optional(),
  }),
]);

export type NextStep = z.infer<typeof nextStepContract>;
