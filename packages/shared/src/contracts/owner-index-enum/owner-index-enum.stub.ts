import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexEnumContract } from './owner-index-enum-contract';
import type { OwnerIndexEnum } from './owner-index-enum-contract';

export const OwnerIndexEnumStub = ({
  ...props
}: StubArgument<OwnerIndexEnum> = {}): OwnerIndexEnum =>
  ownerIndexEnumContract.parse({
    ownerName: 'ThingKind',
    contractName: 'thingKindContract',
    filePath: '/repo/packages/example/src/contracts/thing-kind/thing-kind-contract.ts',
    packageName: '@repo/example',
    values: ['large', 'small'],
    ...props,
  });
