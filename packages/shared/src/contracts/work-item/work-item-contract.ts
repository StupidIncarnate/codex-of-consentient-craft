/**
 * PURPOSE: Generic persisted work item in quest.json. No role-specific data.
 *
 * USAGE:
 * workItemContract.parse({id: 'f47ac10b-...', role: 'codeweaver', status: 'pending', ...});
 * // Returns: WorkItem object
 */

import { z } from 'zod';

import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { relatedDataItemContract } from '../related-data-item/related-data-item-contract';
import { sessionIdContract } from '../session-id/session-id-contract';
import { spawnerTypeContract } from '../spawner-type/spawner-type-contract';
import { workItemRoleContract } from '../work-item-role/work-item-role-contract';
import { workItemStatusContract } from '../work-item-status/work-item-status-contract';

export const workItemContract = z.object({
  id: questWorkItemIdContract,
  role: workItemRoleContract,
  status: workItemStatusContract,
  spawnerType: spawnerTypeContract,
  sessionId: sessionIdContract.optional(),
  relatedDataItems: z.array(relatedDataItemContract).default([]),
  dependsOn: z.array(questWorkItemIdContract).default([]),
  attempt: z.number().int().nonnegative().brand<'Attempt'>().default(0),
  maxAttempts: z.number().int().positive().brand<'MaxAttempts'>().default(1),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  errorMessage: z.string().brand<'ErrorMessage'>().optional(),
  insertedBy: questWorkItemIdContract.optional(),
  wardMode: z.enum(['changed', 'full']).optional(),
});

export type WorkItem = z.infer<typeof workItemContract>;
