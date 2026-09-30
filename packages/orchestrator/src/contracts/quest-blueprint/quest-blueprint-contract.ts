/**
 * PURPOSE: Defines the input shape for the quest hydrator — a strict subset of questContract plus hydrator directives
 *
 * USAGE:
 * questBlueprintContract.parse({
 *   title: 'Smoketest quest',
 *   userRequest: 'Verify orchestration pipeline',
 *   flows: [...],
 *   designDecisions: [],
 *   contracts: [],
 *   toolingRequirements: [],
 *   operations: [...],
 *   targetStatus: 'in_progress',
 *   skipRoles: ['ward'],
 * });
 * // Returns: QuestBlueprint object validated against questContract's schema
 */

import { z } from '#gateway/npm/zod';

import {
  questContract,
  questStatusContract,
  workItemRoleContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

export const questBlueprintContract = questContract
  .pick({
    title: true,
    userRequest: true,
    flows: true,
    designDecisions: true,
    contracts: true,
    toolingRequirements: true,
    operations: true,
    packagesAffected: true,
  })
  .extend({
    targetStatus: questStatusContract.optional(),
    skipRoles: z.array(workItemRoleContract).default([]),
    fixedQuestId: questContract.shape.id.optional(),
    fixedWorkItemId: workItemContract.shape.id.optional(),
    // `z.partialRecord`, not `z.record` — zod v4 made an enum-keyed `z.record` exhaustive (every
    // role required), and a real caller overrides at most a few roles' prompts.
    rolePromptOverrides: z
      .partialRecord(
        workItemRoleContract,
        z.string().min(1).brand<'QuestBlueprintRolePromptOverrides'>(),
      )
      .default({}),
  })
  .brand<'QuestBlueprint'>();

export type QuestBlueprint = z.infer<typeof questBlueprintContract>;
