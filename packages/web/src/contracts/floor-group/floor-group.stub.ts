import type { StubArgument } from '@dungeonmaster/shared/@types';

import { floorGroupContract } from './floor-group-contract';
import type { FloorGroup } from './floor-group-contract';

export const FloorGroupStub = ({ ...props }: StubArgument<FloorGroup> = {}): FloorGroup =>
  floorGroupContract.parse({
    floorName: 'FORGE',
    floorNumber: 1,
    workItems: [],
    ...props,
  });
