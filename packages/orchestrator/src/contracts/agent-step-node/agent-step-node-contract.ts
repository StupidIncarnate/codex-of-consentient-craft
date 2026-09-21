/**
 * PURPOSE: The ONE field of an `agentFlowStatics` step a reader outside the router needs — which
 * side of the planner/worker/reviewer split that step sits on. Reach for this rather than indexing
 * `agentFlowStatics[family].steps[step]` directly: that object is a union of six differently-shaped
 * step maps, so TypeScript collapses the key set to `never` and `Object.entries` over it widens the
 * value to `any` — a step node read that way carries no type at all.
 *
 * USAGE:
 * agentStepNodeContract.safeParse(stepNode).data?.role;
 * // Returns 'planner' | 'worker' | 'reviewer'
 *
 * `.passthrough()` because a step node carries much more — `kind`, `prompt`, `routes`, `maxVisits`,
 * `needsLane` — and each of those has exactly one reader elsewhere. Declaring them here would be a
 * second copy of a shape the `as const` already pins, and the copy is the one that drifts.
 */

import { z } from 'zod';

export const agentStepNodeContract = z
  .object({
    role: z.enum(['planner', 'worker', 'reviewer']),
  })
  .passthrough();

export type AgentStepNode = z.infer<typeof agentStepNodeContract>;
