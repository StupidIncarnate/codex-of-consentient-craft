import { flowEdgeIdContract } from './flow-edge-id-contract';
import type { FlowEdgeId } from './flow-edge-id-contract';

export const FlowEdgeIdStub = (
  { value }: { value: string } = { value: 'login-to-dashboard' },
): FlowEdgeId => flowEdgeIdContract.parse(value);
