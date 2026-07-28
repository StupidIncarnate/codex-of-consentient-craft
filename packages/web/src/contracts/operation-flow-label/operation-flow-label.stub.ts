import { operationFlowLabelContract } from './operation-flow-label-contract';
import type { OperationFlowLabel } from './operation-flow-label-contract';

export const OperationFlowLabelStub = (
  { value }: { value: string } = { value: 'Send queued comment batch' },
): OperationFlowLabel => operationFlowLabelContract.parse(value);
