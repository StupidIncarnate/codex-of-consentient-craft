/**
 * PURPOSE: Defines the structure of a quest task with status and metadata
 *
 * USAGE:
 * questTaskContract.parse({id: 'abc-123', name: 'Create service', type: 'implementation', status: 'pending'});
 * // Returns: QuestTask object
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { taskStatusContract } from '../task-status/task-status-contract';

export const questRequirementContract = z.object({
  id: z.string().uuid().brand<'RequirementId'>(),
  name: z.string().min(1).brand<'RequirementName'>(),
  description: z.string().brand<'RequirementDescription'>().optional(),
  status: taskStatusContract,
  dependencies: z.array(z.string().uuid().brand<'RequirementId'>()).optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  observableIds: z.array(observableIdContract),
});

export type QuestRequirement = z.infer<typeof questRequirementContract>;
