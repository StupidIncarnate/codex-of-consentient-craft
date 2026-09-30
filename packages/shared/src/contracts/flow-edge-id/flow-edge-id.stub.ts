import type { FlowEdge } from '../flow-edge/flow-edge-contract';
import { flowEdgeContract } from '../flow-edge/flow-edge-contract';

const flowEdgeIdContract = flowEdgeContract.shape.id;

export const FlowEdgeIdStub = (
  { value }: { value: string } = { value: 'login-to-dashboard' },
): FlowEdge['id'] => flowEdgeIdContract.parse(value);
