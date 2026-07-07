import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowPortalNodeDataContract } from './flow-portal-node-data-contract';
import type { FlowPortalNodeData } from './flow-portal-node-data-contract';

export const FlowPortalNodeDataStub = ({
  ...props
}: StubArgument<FlowPortalNodeData> = {}): FlowPortalNodeData =>
  flowPortalNodeDataContract.parse({
    reference: 'compile-flow:compile-entry',
    label: '↗ compile-flow → compile-entry',
    ...props,
  });
