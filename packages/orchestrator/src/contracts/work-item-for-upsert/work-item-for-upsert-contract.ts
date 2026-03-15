/**
 * PURPOSE: Partial work item schema for modify-quest-input. Only id is required;
 *          all other fields are optional for partial updates.
 *
 * USAGE:
 * workItemForUpsertContract.parse({ id: 'f47ac10b-...', status: 'complete' });
 * // Returns: WorkItemForUpsert with only id required
 */

import { questWorkItemIdContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const workItemForUpsertContract = workItemContract.partial().extend({
  id: questWorkItemIdContract,
});

export type WorkItemForUpsert = ReturnType<typeof workItemForUpsertContract.parse>;
