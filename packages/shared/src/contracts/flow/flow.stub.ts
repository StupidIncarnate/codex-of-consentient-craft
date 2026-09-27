import type { StubArgument } from '../../@types/stub-argument.type';

import { flowContract } from './flow-contract';
import type { Flow } from './flow-contract';

export const FlowStub = ({ ...props }: StubArgument<Flow> = {}): Flow =>
  flowContract.parse({
    id: 'login-flow',
    name: 'Login Flow',
    flowType: 'runtime',
    entryPoint: '/login',
    exitPoints: ['/dashboard'],
    nodes: [],
    edges: [],
    ...props,
  });
