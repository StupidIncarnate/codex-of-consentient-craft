import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowEdgeContract } from './flow-edge-contract';
import type { FlowEdge } from './flow-edge-contract';

export const FlowEdgeStub = ({ ...props }: StubArgument<FlowEdge> = {}): FlowEdge =>
  flowEdgeContract.parse({
    id: 'login-to-dashboard',
    from: 'login-page',
    to: 'dashboard',
    ...props,
  });
