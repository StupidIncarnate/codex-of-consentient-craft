/**
 * PURPOSE: Partial work item schema for modify-quest-input. Only id is required;
 *          all other fields are optional for partial updates.
 *
 * USAGE:
 * workItemForUpsertContract.parse({ id: 'f47ac10b-...', status: 'complete' });
 * // Returns: WorkItemForUpsert with only id required
 */

import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { workItemContract } from '../work-item/work-item-contract';

export const workItemForUpsertContract = workItemContract.partial().extend({
  id: questWorkItemIdContract,
});

export type WorkItemForUpsert = ReturnType<typeof workItemForUpsertContract.parse>;
