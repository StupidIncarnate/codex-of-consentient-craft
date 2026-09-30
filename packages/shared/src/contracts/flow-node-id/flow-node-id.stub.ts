import type { FlowNode } from '../flow-node/flow-node-contract';
import { flowNodeContract } from '../flow-node/flow-node-contract';

export const FlowNodeIdStub = ({ value }: { value: string } = { value: 'start' }): FlowNode['id'] =>
  flowNodeContract.shape.id.parse(value);
