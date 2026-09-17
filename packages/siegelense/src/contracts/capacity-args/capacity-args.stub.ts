import type { StubArgument } from '@dungeonmaster/shared/@types';

import { capacityArgsContract } from './capacity-args-contract';
import type { CapacityArgs } from './capacity-args-contract';

export const CapacityArgsStub = ({ ...props }: StubArgument<CapacityArgs> = {}): CapacityArgs =>
  capacityArgsContract.parse({
    specName: null,
    poolSize: null,
    ...props,
  });
