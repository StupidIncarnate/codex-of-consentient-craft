import type { StubArgument } from '@dungeonmaster/shared/@types';

import { reactFlowNodeDataContract } from './react-flow-node-data-contract';
import type { ReactFlowNodeData } from './react-flow-node-data-contract';

export const ReactFlowNodeDataStub = ({
  ...props
}: StubArgument<ReactFlowNodeData> = {}): ReactFlowNodeData =>
  reactFlowNodeDataContract.parse({
    nodeId: 'login-page',
    label: 'Login Page',
    nodeType: 'state',
    packages: [{ name: 'auth-service', packageType: 'library' }],
    contractCount: 0,
    commentCount: 0,
    ...props,
  });
