/**
 * PURPOSE: Defines the interface for work tracking operations used by orchestration phases
 *
 * USAGE:
 * const tracker: WorkTracker = workUnitsToWorkTrackerTransformer({workUnits});
 * const readyIds = tracker.getReadyWorkIds();
 * // Provides dependency injection interface for work item lifecycle management
 */

import { z } from 'zod';

import { agentRoleContract } from '../agent-role/agent-role-contract';
import { workItemIdContract } from '../work-item-id/work-item-id-contract';
import { workUnitContract } from '../work-unit/work-unit-contract';

export const workTrackerContract = z.object({
  getReadyWorkIds: z.function().args().returns(z.array(workItemIdContract)),
  getWorkUnit: z
    .function()
    .args(z.object({ workItemId: workItemIdContract }))
    .returns(workUnitContract),
  markStarted: z
    .function()
    .args(z.object({ workItemId: workItemIdContract }))
    .returns(z.promise(z.void())),
  markCompleted: z
    .function()
    .args(z.object({ workItemId: workItemIdContract }))
    .returns(z.promise(z.void())),
  markFailed: z
    .function()
    .args(z.object({ workItemId: workItemIdContract }))
    .returns(z.promise(z.void())),
  markPartiallyCompleted: z
    .function()
    .args(z.object({ workItemId: workItemIdContract }))
    .returns(z.promise(z.void())),
  markBlocked: z
    .function()
    .args(z.object({ workItemId: workItemIdContract, targetRole: agentRoleContract }))
    .returns(z.promise(z.void())),
  isAllComplete: z.function().args().returns(z.boolean()),
  getIncompleteIds: z.function().args().returns(z.array(workItemIdContract)),
  getFailedIds: z.function().args().returns(z.array(workItemIdContract)),
  addWorkItem: z
    .function()
    .args(z.object({ workItemId: workItemIdContract, workUnit: workUnitContract }))
    .returns(z.void()),
});

export type WorkTracker = z.infer<typeof workTrackerContract>;
