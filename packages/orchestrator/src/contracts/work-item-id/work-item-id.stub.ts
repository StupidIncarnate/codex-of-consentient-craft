import { workItemIdContract } from './work-item-id-contract';
import type { WorkItemId } from './work-item-id-contract';

export const WorkItemIdStub = (
  { value }: { value: string } = { value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
): WorkItemId => workItemIdContract.parse(value);
