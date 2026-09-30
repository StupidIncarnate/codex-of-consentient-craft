import type { StubArgument } from '@dungeonmaster/shared/@types';

import { instanceMemoryContract } from './instance-memory-contract';
import type { InstanceMemory } from './instance-memory-contract';

export const InstanceMemoryStub = ({
  ...props
}: StubArgument<InstanceMemory> = {}): InstanceMemory =>
  instanceMemoryContract.parse({
    megabytes: 1840,
    measured: 'live',
    ...props,
  });
