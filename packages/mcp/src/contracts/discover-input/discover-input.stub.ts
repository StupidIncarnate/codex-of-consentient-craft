import { discoverInputContract } from './discover-input-contract';
import type { DiscoverInput } from './discover-input-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const DiscoverInputStub = ({ ...props }: StubArgument<DiscoverInput> = {}): DiscoverInput =>
  discoverInputContract.parse({
    type: 'files',
    ...props,
  });
