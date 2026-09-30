import type { WorkItem } from '@dungeonmaster/shared/contracts';
import { workItemContract } from '@dungeonmaster/shared/contracts';

export const WorkItemIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): WorkItem['id'] => {
  const workItemIdContract = workItemContract.shape.id;
  return workItemIdContract.parse(value);
};
