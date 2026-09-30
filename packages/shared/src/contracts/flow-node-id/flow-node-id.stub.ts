import type { FlowNode } from '../flow-node/flow-node-contract';
import { flowNodeContract } from '../flow-node/flow-node-contract';

const flowNodeIdContract = flowNodeContract.shape.id;

export const FlowNodeIdStub = ({ value }: { value: string } = { value: 'start' }): FlowNode['id'] =>
  flowNodeIdContract.parse(value);
