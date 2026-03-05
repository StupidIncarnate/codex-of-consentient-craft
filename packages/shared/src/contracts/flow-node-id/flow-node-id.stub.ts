import { flowNodeIdContract } from './flow-node-id-contract';
import type { FlowNodeId } from './flow-node-id-contract';

export const FlowNodeIdStub = ({ value }: { value: string } = { value: 'start' }): FlowNodeId =>
  flowNodeIdContract.parse(value);
