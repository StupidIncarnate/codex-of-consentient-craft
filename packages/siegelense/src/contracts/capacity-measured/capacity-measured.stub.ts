import type { StubArgument } from '@dungeonmaster/shared/@types';

import { capacityMeasuredContract } from './capacity-measured-contract';
import type { CapacityMeasured } from './capacity-measured-contract';

export const CapacityMeasuredStub = ({
  ...props
}: StubArgument<CapacityMeasured> = {}): CapacityMeasured =>
  capacityMeasuredContract.parse({
    freeMemMB: 5320,
    cores: 8,
    loadAvg1: 4.2,
    siegeInstances: 1,
    diskFreeMB: 41_000,
    ...props,
  });
