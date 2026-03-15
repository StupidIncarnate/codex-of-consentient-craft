import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workTrackerContract } from './work-tracker-contract';
import type { WorkTracker } from './work-tracker-contract';
import { WorkItemIdStub } from '../work-item-id/work-item-id.stub';
import { WorkUnitStub } from '../work-unit/work-unit.stub';

export const WorkTrackerStub = ({ ...props }: StubArgument<WorkTracker> = {}): WorkTracker =>
  workTrackerContract.parse({
    getReadyWorkIds: () => [WorkItemIdStub()],
    getWorkUnit: () => WorkUnitStub(),
    markStarted: () => undefined,
    markCompleted: () => undefined,
    markFailed: () => undefined,
    markPartiallyCompleted: () => undefined,
    markBlocked: () => undefined,
    isAllComplete: () => false,
    isAllTerminal: () => false,
    getIncompleteIds: () => [WorkItemIdStub()],
    getFailedIds: () => [],
    addWorkItem: () => undefined,
    ...props,
  });
