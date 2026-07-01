import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowObservableNodeDataContract } from './flow-observable-node-data-contract';
import type { FlowObservableNodeData } from './flow-observable-node-data-contract';

export const FlowObservableNodeDataStub = ({
  ...props
}: StubArgument<FlowObservableNodeData> = {}): FlowObservableNodeData =>
  flowObservableNodeDataContract.parse({
    observableId: 'login-redirects-to-dashboard',
    outcomeType: 'ui-state',
    description: 'redirects to dashboard',
    ...props,
  });
