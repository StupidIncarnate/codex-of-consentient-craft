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
import { taskTypeContract } from '../task-type/task-type-contract';

export const questTaskContract = z.object({
  id: z.string().uuid().brand<'TaskId'>(),
  name: z.string().min(1).brand<'TaskName'>(),
  type: taskTypeContract,
  description: z.string().brand<'TaskDescription'>().optional(),
  status: taskStatusContract,
  dependencies: z.array(z.string().uuid().brand<'TaskId'>()).optional(),
  filesToCreate: z.array(z.string().brand<'FilePath'>()).optional(),
  filesToEdit: z.array(z.string().brand<'FilePath'>()).optional(),
  completedBy: z.string().brand<'ReportFilename'>().optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  errorMessage: z.string().brand<'ErrorMessage'>().optional(),
  observableIds: z.array(observableIdContract),
});

export type QuestTask = z.infer<typeof questTaskContract>;
