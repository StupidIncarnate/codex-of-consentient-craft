import type { StubArgument } from '@dungeonmaster/shared/@types';

import { laneCapacityContract } from './lane-capacity-contract';
import type { LaneCapacity } from './lane-capacity-contract';

export const LaneCapacityStub = ({ ...props }: StubArgument<LaneCapacity> = {}): LaneCapacity =>
  laneCapacityContract.parse({
    suggested: 2,
    ...props,
  });
