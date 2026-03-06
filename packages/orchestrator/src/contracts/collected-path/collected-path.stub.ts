import type { StubArgument } from '@dungeonmaster/shared/@types';

import { collectedPathContract } from './collected-path-contract';
import type { CollectedPath } from './collected-path-contract';

export const CollectedPathStub = ({ ...props }: StubArgument<CollectedPath> = {}): CollectedPath =>
  collectedPathContract.parse({
    steps: [{ nodeId: 'start', transition: null }],
    terminalNodeId: 'end-state',
    ...props,
  });
