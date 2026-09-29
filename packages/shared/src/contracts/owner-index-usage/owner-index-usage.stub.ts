import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexUsageContract } from './owner-index-usage-contract';
import type { OwnerIndexUsage } from './owner-index-usage-contract';

export const OwnerIndexUsageStub = ({
  ...props
}: StubArgument<OwnerIndexUsage> = {}): OwnerIndexUsage =>
  ownerIndexUsageContract.parse({
    filePath: '/repo/packages/example/src/contracts/other/other-contract.ts',
    contractName: 'otherContract',
    key: 'thingId',
    kind: 'owner-reuse',
    ...props,
  });
