import type { StubArgument } from '@dungeonmaster/shared/@types';

import { workItemForUpsertContract } from './work-item-for-upsert-contract';
import type { WorkItemForUpsert } from './work-item-for-upsert-contract';

export const WorkItemForUpsertStub = ({
  ...props
}: StubArgument<WorkItemForUpsert> = {}): WorkItemForUpsert =>
  workItemForUpsertContract.parse({
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
