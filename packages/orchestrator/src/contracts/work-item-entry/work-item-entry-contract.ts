/**
 * PURPOSE: Defines the internal state entry for a work item tracked by WorkTracker
 *
 * USAGE:
 * const entry: WorkItemEntry = {workUnit, status: 'pending', retryCount: failCountContract.parse(0)};
 * // Represents a single work item's state within the tracker
 */

import { z } from 'zod';

import { failCountContract } from '../fail-count/fail-count-contract';
import { workUnitContract } from '../work-unit/work-unit-contract';

const workItemStatusContract = z.enum([
  'pending',
  'started',
  'completed',
  'failed',
  'partially-completed',
  'blocked',
]);

export type WorkItemStatus = z.infer<typeof workItemStatusContract>;

export const workItemEntryContract = z.object({
  workUnit: workUnitContract,
  status: workItemStatusContract,
  retryCount: failCountContract,
});

export type WorkItemEntry = z.infer<typeof workItemEntryContract>;
