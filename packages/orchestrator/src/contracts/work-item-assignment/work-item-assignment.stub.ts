import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workItemAssignmentContract } from './work-item-assignment-contract';
import type { WorkItemAssignment } from './work-item-assignment-contract';

export const WorkItemAssignmentStub = ({
  ...props
}: StubArgument<WorkItemAssignment> = {}): WorkItemAssignment =>
  workItemAssignmentContract.parse({
    units: [{ unitId: 'send-flow:observable:check-badge-count-text' }],
    ...props,
  });
