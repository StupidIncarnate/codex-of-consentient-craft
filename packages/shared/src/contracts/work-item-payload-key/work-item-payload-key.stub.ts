import { workItemPayloadKeyContract } from './work-item-payload-key-contract';
import type { WorkItemPayloadKey } from './work-item-payload-key-contract';

export const WorkItemPayloadKeyStub = (
  { value }: { value: string } = { value: 'instance' },
): WorkItemPayloadKey => workItemPayloadKeyContract.parse(value);
