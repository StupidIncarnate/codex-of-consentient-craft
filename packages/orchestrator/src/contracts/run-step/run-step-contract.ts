/**
 * PURPOSE: The dispatch instruction for ONE deterministic step — which handler runs it, and the
 * arguments the step's own graph entry declares. Reach for this over `nextStepContract` whenever the
 * caller holds only this variant: that one is the whole union the dispatch loop switches on, where
 * this is the single member `questRunStepBroker` takes, so a caller cannot hand it a `spawn-agents`.
 *
 * USAGE:
 * runStepContract.parse({
 *   type: 'run-step',
 *   questId: 'add-auth',
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   handler: 'commit',
 *   args: [],
 * });
 * // Returns: RunStep
 *
 * IT CARRIES A HANDLER RATHER THAN A ROLE, because a deterministic step's work item carries the
 * ROLE OF ITS SCOPE, not of the step itself: a `commit` step inside a codeweaver scope reads
 * `role: 'codeweaver'`, and dispatching on that role alone would spawn a Claude session for a step
 * that has to run a handler instead.
 *
 * `args` RIDE THE STEP, not the work item: `agentFlowStatics` is where a ward step declares
 * `['--committed', '--uncommitted']` and the full gate declares `[]`, and passing them VERBATIM is
 * what keeps one ward invocation out of every call site's ternary.
 */

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { agentStepNodeContract } from '../agent-step-node/agent-step-node-contract';
import { stepHandlerNameContract } from '../step-handler-name/step-handler-name-contract';

export const runStepContract = z.object({
  type: z.literal('run-step'),
  questId: questIdContract,
  workItemId: questWorkItemIdContract,
  handler: stepHandlerNameContract,
  // The step node's OWN array schema, unwrapped from its optional — one declaration of what a
  // handler argument is, so the dispatch instruction cannot brand it differently from the graph.
  args: agentStepNodeContract.shape.args.unwrap(),
});

export type RunStep = z.infer<typeof runStepContract>;
