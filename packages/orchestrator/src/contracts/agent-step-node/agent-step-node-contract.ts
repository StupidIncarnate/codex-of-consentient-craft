/**
 * PURPOSE: The fields of an `agentFlowStatics` step a reader outside the router needs — which side
 * of the planner/worker/reviewer split it sits on, and how it is DISPATCHED. Reach for this rather
 * than indexing `agentFlowStatics[family].steps[step]` directly: that object is a union of six
 * differently-shaped step maps, so TypeScript collapses the key set to `never` and `Object.entries`
 * over it widens the value to `any` — a step node read that way carries no type at all.
 *
 * USAGE:
 * agentStepNodeContract.safeParse(stepNode).data?.role;
 * // Returns 'planner' | 'worker' | 'reviewer'
 * agentStepNodeContract.safeParse(stepNode).data?.handler;
 * // Returns the handler a `kind: 'deterministic'` step runs, or undefined for a prompt step
 *
 * `kind`, `handler`, `args`, `prompt` AND `model` ARE DECLARED because the DISPATCHER reads them. A
 * deterministic step is not spawned as a session at all — it runs its handler through
 * `stepHandlerRunBroker`, and the `args` a ward step declares (`['--committed', '--uncommitted']`,
 * or `[]` for the full gate) ride that call verbatim. A `kind: 'prompt'` step is spawned as a
 * session, and its `prompt` is what `stepDispatchRoleTransformer` keys that session's ROLE on —
 * the scope role its work item carries is the wrong answer for a `repair` inside a `ward` scope.
 * `model` is that same step's Claude CLI `--model` flag, read by `buildSpawnInstructionLayerBroker`
 * for the real dispatch and by `workItemToPromptTransformer` for what `get-agent-prompt` reports —
 * one field, one reader pair, so the two can never name a different model for the same session. A
 * deterministic step carries no `model` (it spawns nothing), which is why the field stays optional.
 * Everything else a step node carries — `routes`, `maxVisits`, `needsLane`, `maxConcurrent` — has
 * exactly one reader inside the router and stays undeclared behind `.passthrough()`, because a
 * second copy of a shape the `as const` already pins is the copy that drifts.
 */

import { z } from 'zod';

import { agentPromptNameContract } from '../agent-prompt-name/agent-prompt-name-contract';
import { claudeModelContract } from '../claude-model/claude-model-contract';
import { stepHandlerNameContract } from '../step-handler-name/step-handler-name-contract';

export const agentStepNodeContract = z
  .object({
    role: z.enum(['planner', 'worker', 'reviewer']),
    kind: z.enum(['prompt', 'deterministic']),
    handler: stepHandlerNameContract.optional(),
    args: z.array(z.string().brand<'StepHandlerArg'>()).optional(),
    prompt: agentPromptNameContract.optional(),
    model: claudeModelContract.optional(),
  })
  .passthrough();

export type AgentStepNode = z.infer<typeof agentStepNodeContract>;
