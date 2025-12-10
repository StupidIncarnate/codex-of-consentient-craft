/**
 * PURPOSE: Defines the main quest structure with phases, tasks, and metadata
 *
 * USAGE:
 * questContract.parse({id: 'add-auth', folder: '001-add-auth', title: 'Add Auth', ...});
 * // Returns: Quest object
 */

import { z } from 'zod';

import { executionLogEntryContract } from '../execution-log-entry/execution-log-entry-contract';
import { questPhaseContract } from '../quest-phase/quest-phase-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { questTaskContract } from '../quest-task/quest-task-contract';

export const questContract = z.object({
  id: z.string().min(1).brand<'QuestId'>(),
  folder: z.string().min(1).brand<'QuestFolder'>(),
  title: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  phases: z.object({
    discovery: questPhaseContract,
    implementation: questPhaseContract,
    testing: questPhaseContract,
    review: questPhaseContract,
  }),
  executionLog: z.array(executionLogEntryContract),
  tasks: z.array(questTaskContract),
  userRequest: z.string().brand<'UserRequest'>().optional(),
  abandonReason: z.string().brand<'AbandonReason'>().optional(),
});

export type Quest = z.infer<typeof questContract>;
