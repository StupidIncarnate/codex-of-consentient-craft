/**
 * PURPOSE: The decision the router hands back for ONE scope — what to mint, where to route, that the
 * scope is finished, or why it stopped. Reach for this over `nextStepContract` by LEVEL: that one
 * answers the dispatch loop's "what do I spawn across every quest right now", where this answers
 * "what does this operation item do next" and performs none of it.
 *
 * USAGE:
 * nextActionContract.parse({
 *   kind: 'mint',
 *   operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
 *   step: 'fixHappy',
 *   cause: 'unmet',
 *   batch: [{ step: 'fixHappy', role: 'siegemaster' }],
 * });
 * // Returns: NextAction
 *
 * `mint` AND `route` BOTH CARRY A BATCH AND ARE STILL TWO VARIANTS. `route` is the only one meaning
 * "every piece at `from` has DRAINED" — the phase rule — and that is a fact the ledger cannot cheaply
 * re-derive afterwards, because the ledger is a list and the step map has cycles. `mint` means the
 * scope is still inside a step it already entered: a loop-back, a request, or the next batch of a
 * step already running.
 *
 * `cause: 'capped'` WITH AN EMPTY BATCH IS THE ONLY EMPTY BATCH THIS CONTRACT CARRIES, and it is the
 * honest "come back": a concurrency cap holding every browser piece back, or a step with pieces still
 * running. Neither state is done and neither is blocked, so `complete` and `block` would both be
 * lies. `route`'s own `.min(1)` is what stops an empty batch reading as a phase transition.
 */

import { operationItemIdContract, stepNameContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { mintedWorkItemContract } from '../minted-work-item/minted-work-item-contract';
import { stepOutcomeContract } from '../step-outcome/step-outcome-contract';

export const nextActionContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('mint'),
    operationItemId: operationItemIdContract,
    step: stepNameContract.describe(
      'Every item in `batch` sits at THIS step — the outcome fold is per step.',
    ),
    cause: z.enum(['request', 'unmet', 'plan-batch', 'return-to-minter', 'invalidation', 'capped']),
    batch: z.array(mintedWorkItemContract),
  }),
  z.object({
    kind: z.literal('route'),
    operationItemId: operationItemIdContract,
    from: stepNameContract,
    outcome: stepOutcomeContract,
    step: stepNameContract.describe('The ROUTE TARGET. `batch` sits here.'),
    batch: z.array(mintedWorkItemContract).min(1),
  }),
  z.object({
    kind: z.literal('complete'),
    operationItemId: operationItemIdContract,
    outcome: stepOutcomeContract.describe('`done` or `empty` — the word that reached `@done`.'),
  }),
  z.object({
    kind: z.literal('block'),
    operationItemId: operationItemIdContract,
    family: z.string().min(1).brand<'AgentFamilyName'>(),
    step: stepNameContract,
    reason: z.enum(['wall', 'max-visits', 'unknown-step', 'unknown-route-target', 'no-minter']),
    message: z.string().min(1).brand<'BlockMessage'>(),
  }),
]);

export type NextAction = z.infer<typeof nextActionContract>;
