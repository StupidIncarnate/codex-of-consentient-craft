/**
 * PURPOSE: Builds a valid OwnerIndexShard for tests
 *
 * USAGE:
 * OwnerIndexShardStub();
 * // Returns a valid OwnerIndexShard for an empty package
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexShardContract } from './owner-index-shard-contract';
import type { OwnerIndexShard } from './owner-index-shard-contract';

export const OwnerIndexShardStub = ({
  ...props
}: StubArgument<OwnerIndexShard> = {}): OwnerIndexShard =>
  ownerIndexShardContract.parse({
    schemaVersion: 2,
    sharedVersion: '0.1.0',
    packageName: '@repo/alpha',
    packageDir: '/repo/packages/alpha',
    files: [],
    ...props,
  });
