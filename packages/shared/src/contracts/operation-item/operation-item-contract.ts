/**
 * PURPOSE: One durable entry on the quest operations ledger — the ordered plan/status record that drives dispatch
 *
 * USAGE:
 * operationItemContract.parse({id: 'f47ac10b-...', role: 'codeweaver', text: 'core: config adapter', status: 'pending'});
 * // Returns: OperationItem object
 *
 * The ledger has exactly TWO writers: ChaosWhisperer authors the plan items at spec time (via
 * modify-quest, allowlist-gated to explore_observables) and the orchestrator mutates status at
 * runtime (via questOperationsUpdateBroker). Execution agents never write it — they signal an
 * outcome and the orchestrator applies it. There is no `partial` status: a `partially_complete`
 * signal marks the item `complete` and appends a "pt N: {text}" continuation item, keeping the
 * strict 1:1 operation-item↔work-item invariant and an immutable pt audit trail.
 */

import { z } from 'zod';

import { operationItemIdContract } from '../operation-item-id/operation-item-id-contract';
import { workItemRoleContract } from '../work-item-role/work-item-role-contract';

export const operationItemContract = z.object({
  id: operationItemIdContract,
  role: workItemRoleContract,
  text: z
    .string()
    .min(1)
    .brand<'OperationText'>()
    .describe('Prose description of the operation. Continuations are auto-named "pt N: {text}"'),
  status: z.enum(['pending', 'in_progress', 'complete']),
  locked: z
    .boolean()
    .default(false)
    .describe(
      'Orchestrator/Chaos-owned items (the plan item and the fixed verify tail) that cannot be deleted via modify-quest',
    ),
  wardMode: z
    .enum(['changed', 'full'])
    .optional()
    .describe('Only on role:ward items — which ward invocation the run-ward work item executes'),
});

export type OperationItem = z.infer<typeof operationItemContract>;
