import { flowEdgeRefContract } from './flow-edge-ref-contract';
import type { FlowEdgeRef } from './flow-edge-ref-contract';

export const FlowEdgeRefStub = (
  { value }: { value: string } = { value: 'login-page' },
): FlowEdgeRef => flowEdgeRefContract.parse(value);
