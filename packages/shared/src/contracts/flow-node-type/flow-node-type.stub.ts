import { flowNodeTypeContract } from './flow-node-type-contract';
import type { FlowNodeType } from './flow-node-type-contract';

export const FlowNodeTypeStub = ({ value }: { value?: FlowNodeType } = {}): FlowNodeType =>
  flowNodeTypeContract.parse(value ?? 'state');
