import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dagEdgeContract } from './dag-edge-contract';
import type { DagEdge } from './dag-edge-contract';

export const DagEdgeStub = ({ ...props }: StubArgument<DagEdge> = {}): DagEdge =>
  dagEdgeContract.parse({
    id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
    dependsOn: [],
    ...props,
  });
