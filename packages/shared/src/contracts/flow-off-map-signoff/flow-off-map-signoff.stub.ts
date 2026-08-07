import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowOffMapSignoffContract } from './flow-off-map-signoff-contract';
import type { FlowOffMapSignoff } from './flow-off-map-signoff-contract';

export const FlowOffMapSignoffStub = ({
  ...props
}: StubArgument<FlowOffMapSignoff> = {}): FlowOffMapSignoff =>
  flowOffMapSignoffContract.parse({
    id: 'concurrency',
    ...props,
  });
