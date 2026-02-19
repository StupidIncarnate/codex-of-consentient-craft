import { flowIdContract } from './flow-id-contract';
import type { FlowId } from './flow-id-contract';

export const FlowIdStub = (
  { value }: { value: string } = { value: 'c23bd10b-58cc-4372-a567-0e02b2c3d479' },
): FlowId => flowIdContract.parse(value);
