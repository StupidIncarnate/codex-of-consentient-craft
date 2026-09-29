import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexStandaloneBrandContract } from './owner-index-standalone-brand-contract';
import type { OwnerIndexStandaloneBrand } from './owner-index-standalone-brand-contract';

export const OwnerIndexStandaloneBrandStub = ({
  ...props
}: StubArgument<OwnerIndexStandaloneBrand> = {}): OwnerIndexStandaloneBrand =>
  ownerIndexStandaloneBrandContract.parse({
    contractName: 'thingIdContract',
    brandText: 'ThingId',
    filePath: '/repo/packages/example/src/contracts/thing-id/thing-id-contract.ts',
    packageName: '@repo/example',
    ...props,
  });
