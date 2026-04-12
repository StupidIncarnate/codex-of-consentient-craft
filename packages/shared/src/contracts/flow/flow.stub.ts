import type { StubArgument } from '@dungeonmaster/shared/@types';

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
