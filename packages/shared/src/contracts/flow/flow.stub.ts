import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowContract } from './flow-contract';
import type { Flow } from './flow-contract';

export const FlowStub = ({ ...props }: StubArgument<Flow> = {}): Flow =>
  flowContract.parse({
    id: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Login Flow',
    requirementIds: [],
    diagram: 'graph TD; A[Start] --> B[Login Page] --> C[Dashboard]',
    entryPoint: '/login',
    exitPoints: ['/dashboard'],
    ...props,
  });
