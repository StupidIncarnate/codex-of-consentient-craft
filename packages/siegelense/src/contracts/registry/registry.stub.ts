import type { StubArgument } from '@dungeonmaster/shared/@types';

import { RegistryEntryStub } from '../registry-entry/registry-entry.stub';
import { registryContract } from './registry-contract';
import type { Registry } from './registry-contract';

export const RegistryStub = ({ ...props }: StubArgument<Registry> = {}): Registry =>
  registryContract.parse({
    instances: [RegistryEntryStub()],
    ...props,
  });
