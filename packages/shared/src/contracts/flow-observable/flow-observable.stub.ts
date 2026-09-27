import type { StubArgument } from '../../@types/stub-argument.type';

import { flowObservableContract } from './flow-observable-contract';
import type { FlowObservable } from './flow-observable-contract';

export const FlowObservableStub = ({
  ...props
}: StubArgument<FlowObservable> = {}): FlowObservable =>
  flowObservableContract.parse({
    id: 'login-redirects-to-dashboard',
    type: 'ui-state',
    description: 'redirects to dashboard',
    package: 'auth-service',
    ...props,
  });
