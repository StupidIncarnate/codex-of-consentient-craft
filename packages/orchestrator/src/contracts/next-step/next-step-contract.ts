/**
 * PURPOSE: Discriminated union returned by quest-get-next-step-broker telling the /dumpster-launch loop what to do next
 *
 * USAGE:
 * nextStepContract.parse({ type: 'idle' });
 * nextStepContract.parse({ type: 'spawn-agents', agents: [SpawnInstruction, ...] });
 * nextStepContract.parse({ type: 'run-ward', questId, workItemId, mode: 'changed' });
 * nextStepContract.parse({ type: 'run-riftcarver', questId, workItemId });
 * // Returns: NextStep variant
 */

import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

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
    mode: z.enum(['changed', 'full']),
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
    // Set when idle is forced rather than organic — e.g. the Node dispatcher owns the queue,
    // so /dumpster-launch's poll is told why nothing will ever be returned.
    reason: z.string().min(1).brand<'IdleReason'>().optional(),
  }),
]);

export type NextStep = z.infer<typeof nextStepContract>;
