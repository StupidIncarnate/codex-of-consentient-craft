import type { StubArgument } from '../../@types/stub-argument.type';

import { flowNodeContract } from './flow-node-contract';
import type { FlowNode } from './flow-node-contract';

export const FlowNodeStub = ({ ...props }: StubArgument<FlowNode> = {}): FlowNode =>
  flowNodeContract.parse({
    id: 'login-page',
    label: 'Login Page',
    type: 'state',
    packages: ['auth-service'],
    observables: [],
    ...props,
  });
