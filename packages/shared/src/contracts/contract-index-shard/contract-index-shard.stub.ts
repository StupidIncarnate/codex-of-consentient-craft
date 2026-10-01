/**
 * PURPOSE: Builds a valid ContractIndexShard for tests
 *
 * USAGE:
 * ContractIndexShardStub();
 * // Returns a valid ContractIndexShard for a package with no parsed files
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractIndexShardContract } from './contract-index-shard-contract';
import type { ContractIndexShard } from './contract-index-shard-contract';

export const ContractIndexShardStub = ({
  ...props
}: StubArgument<ContractIndexShard> = {}): ContractIndexShard =>
  contractIndexShardContract.parse({
    schemaVersion: 1,
    sharedVersion: '0.1.0',
    packageName: '@repo/alpha',
    packageDir: '/repo/packages/alpha',
    files: [],
    ...props,
  });
