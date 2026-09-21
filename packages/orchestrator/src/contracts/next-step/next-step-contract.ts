/**
 * PURPOSE: Discriminated union returned by quest-get-next-step-broker telling the /dumpster-launch loop what to do next
 *
 * USAGE:
 * nextStepContract.parse({ type: 'idle' });
 * nextStepContract.parse({ type: 'spawn-agents', agents: [SpawnInstruction, ...] });
 * nextStepContract.parse({ type: 'run-ward', questId, workItemId });
 * nextStepContract.parse({ type: 'run-riftcarver', questId, workItemId });
 * nextStepContract.parse({ type: 'run-step', questId, workItemId, handler: 'commit', args: [] });
 * // Returns: NextStep variant
 */

import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

import { idleReasonContract } from '../idle-reason/idle-reason-contract';
import { runStepContract } from '../run-step/run-step-contract';
import { spawnInstructionContract } from '../spawn-instruction/spawn-instruction-contract';

export const nextStepContract = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('spawn-agents'),
    agents: z.array(spawnInstructionContract),
  }),
  z.object({
    // `wardFull` is the only family whose role is `ward`, so this variant always means the full
    // monorepo gate. A family's own committed ward is a deterministic STEP and dispatches as
    // `run-step`, carrying its scope in the step's own `args`.
    type: z.literal('run-ward'),
    questId: questIdContract,
    workItemId: questWorkItemIdContract,
  }),
  z.object({
    // The other command role, and it reads its own scope off the quest.
    type: z.literal('run-riftcarver'),
    questId: questIdContract,
    workItemId: questWorkItemIdContract,
  }),
  // A DETERMINISTIC step, dispatched by HANDLER rather than by the work item's role. Its own
  // contract because `questRunStepBroker` takes exactly this member and nothing else — see that
  // file's header for why the role-keyed members above cannot carry it.
  runStepContract,
  z.object({
    type: z.literal('idle'),
    // Set when idle is forced rather than organic — the Node dispatcher owns the queue, or the
    // rate-limit guardrail is holding it — so /dumpster-launch's poll is told why nothing will be
    // returned instead of polling on.
    reason: idleReasonContract.optional(),
  }),
]);

export type NextStep = z.infer<typeof nextStepContract>;
