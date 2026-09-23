/**
 * PURPOSE: Discriminated union returned by quest-get-next-step-broker telling the /dumpster-launch loop what to do next
 *
 * USAGE:
 * nextStepContract.parse({ type: 'idle' });
 * nextStepContract.parse({ type: 'spawn-agents', agents: [SpawnInstruction, ...] });
 * nextStepContract.parse({ type: 'run-step', questId, workItemId, handler: 'commit', args: [] });
 * // Returns: NextStep variant
 */

import { z } from 'zod';

import { idleReasonContract } from '../idle-reason/idle-reason-contract';
import { runStepContract } from '../run-step/run-step-contract';
import { spawnInstructionContract } from '../spawn-instruction/spawn-instruction-contract';

export const nextStepContract = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('spawn-agents'),
    agents: z.array(spawnInstructionContract),
  }),
  // A DETERMINISTIC step, dispatched by HANDLER rather than by the work item's role — every
  // family carrying a command role (`ward`, `riftcarver`) now runs it through a step of its own
  // (`wardFull`'s `gate`, `riftcarver`'s `carve`), so this is the only member a command
  // dispatches through. Its own contract because `questRunStepBroker` takes exactly this member
  // and nothing else.
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
