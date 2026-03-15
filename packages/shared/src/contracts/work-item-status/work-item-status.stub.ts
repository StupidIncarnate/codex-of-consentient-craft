import { workItemStatusContract } from './work-item-status-contract';
import type { WorkItemStatus } from './work-item-status-contract';

export const WorkItemStatusStub = ({ value }: { value?: WorkItemStatus } = {}): WorkItemStatus =>
  workItemStatusContract.parse(value ?? 'pending');
