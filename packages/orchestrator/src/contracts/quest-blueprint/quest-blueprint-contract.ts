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
 *   planningNotes: { scopeClassification, surfaceReports, synthesis, walkFindings },
 *   steps: [...],
 *   targetStatus: 'in_progress',
 *   skipRoles: ['ward'],
 * });
 * // Returns: QuestBlueprint object validated against questContract's schema
 */

import { z } from 'zod';

import {
  questContract,
  questIdContract,
  questStatusContract,
  workItemRoleContract,
} from '@dungeonmaster/shared/contracts';

export const questBlueprintContract = questContract
  .pick({
    title: true,
    userRequest: true,
    flows: true,
    designDecisions: true,
    contracts: true,
    toolingRequirements: true,
    planningNotes: true,
    steps: true,
  })
  .extend({
    targetStatus: questStatusContract.optional(),
    skipRoles: z.array(workItemRoleContract).default([]),
    fixedQuestId: questIdContract.optional(),
    rolePromptOverrides: z
      .record(workItemRoleContract, z.string().min(1).brand<'PromptText'>())
      .default({}),
  });

export type QuestBlueprint = z.infer<typeof questBlueprintContract>;
