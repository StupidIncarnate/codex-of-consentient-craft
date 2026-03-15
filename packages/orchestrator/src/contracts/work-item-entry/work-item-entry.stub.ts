import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workItemEntryContract } from './work-item-entry-contract';
import type { WorkItemEntry } from './work-item-entry-contract';
import { FailCountStub } from '../fail-count/fail-count.stub';
import { WorkUnitStub } from '../work-unit/work-unit.stub';

export const WorkItemEntryStub = ({ ...props }: StubArgument<WorkItemEntry> = {}): WorkItemEntry =>
  workItemEntryContract.parse({
    workUnit: WorkUnitStub(),
    status: 'pending',
    retryCount: FailCountStub({ value: 0 }),
    ...props,
  });
