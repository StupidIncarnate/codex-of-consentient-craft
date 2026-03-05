import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowNodeContract } from './flow-node-contract';
import type { FlowNode } from './flow-node-contract';

export const FlowNodeStub = ({ ...props }: StubArgument<FlowNode> = {}): FlowNode =>
  flowNodeContract.parse({
    id: 'login-page',
    label: 'Login Page',
    type: 'state',
    observables: [],
    ...props,
  });
