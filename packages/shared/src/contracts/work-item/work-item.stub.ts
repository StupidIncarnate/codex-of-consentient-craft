import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workItemContract } from './work-item-contract';
import type { WorkItem } from './work-item-contract';

export const WorkItemStub = ({ ...props }: StubArgument<WorkItem> = {}): WorkItem =>
  workItemContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    role: 'codeweaver',
    status: 'pending',
    spawnerType: 'agent',
    relatedDataItems: [],
    dependsOn: [],
    createdAt: '2024-01-15T10:00:00.000Z',
    ...props,
  });
