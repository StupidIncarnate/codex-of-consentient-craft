import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexContract } from './owner-index-contract';
import type { OwnerIndex } from './owner-index-contract';

export const OwnerIndexStub = ({ ...props }: StubArgument<OwnerIndex> = {}): OwnerIndex =>
  ownerIndexContract.parse({
    owners: [],
    standaloneBrands: [],
    packages: [],
    ...props,
  });
