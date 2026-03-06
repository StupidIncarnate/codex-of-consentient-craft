import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowObservableContract } from './flow-observable-contract';
import type { FlowObservable } from './flow-observable-contract';

export const FlowObservableStub = ({
  ...props
}: StubArgument<FlowObservable> = {}): FlowObservable =>
  flowObservableContract.parse({
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    then: [
      {
        type: 'ui-state',
        description: 'redirects to dashboard',
      },
    ],
    ...props,
  });
