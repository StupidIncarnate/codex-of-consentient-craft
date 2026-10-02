import type { StubArgument } from '@dungeonmaster/shared/@types';
import { e2eShardOutputContract, type E2eShardOutput } from './e2e-shard-output-contract';

export const E2eShardOutputStub = ({
  ...props
}: StubArgument<E2eShardOutput> = {}): E2eShardOutput =>
  e2eShardOutputContract.parse({
    shardIndex: 1,
    shardCount: 1,
    output: '',
    exitCode: 0,
    signal: null,
    passingTests: [],
    openHandles: [],
    ...props,
  });
