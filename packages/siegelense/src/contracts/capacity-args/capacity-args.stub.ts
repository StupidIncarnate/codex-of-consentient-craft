import type { StubArgument } from '@dungeonmaster/shared/@types';

import { SpecNameStub } from '../spec-name/spec-name.stub';
import { capacityArgsContract } from './capacity-args-contract';
import type { CapacityArgs } from './capacity-args-contract';

export const CapacityArgsStub = ({ ...props }: StubArgument<CapacityArgs> = {}): CapacityArgs =>
  capacityArgsContract.parse({
    specName: SpecNameStub(),
    poolSize: null,
    isJson: false,
    ...props,
  });
