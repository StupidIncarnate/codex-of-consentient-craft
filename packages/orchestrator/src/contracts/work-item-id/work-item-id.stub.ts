import { workItemIdContract } from './work-item-id-contract';
import type { WorkItemId } from './work-item-id-contract';

export const WorkItemIdStub = (
  { value }: { value: string } = { value: 'work-item-0' },
): WorkItemId => workItemIdContract.parse(value);
