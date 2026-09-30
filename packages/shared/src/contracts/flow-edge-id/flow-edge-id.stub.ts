import type { FlowEdge } from '../flow-edge/flow-edge-contract';
import { flowEdgeContract } from '../flow-edge/flow-edge-contract';

export const FlowEdgeIdStub = (
  { value }: { value: string } = { value: 'login-to-dashboard' },
): FlowEdge['id'] => flowEdgeContract.shape.id.parse(value);
