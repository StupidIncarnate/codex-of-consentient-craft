import type { StubArgument } from '@dungeonmaster/shared/@types';
import { spiritmenderBatchContract } from './spiritmender-batch-contract';
import type { SpiritmenderBatch } from './spiritmender-batch-contract';

export const SpiritmenderBatchStub = ({
  ...props
}: StubArgument<SpiritmenderBatch> = {}): SpiritmenderBatch =>
  spiritmenderBatchContract.parse({
    filePaths: ['/src/brokers/test/test-broker.ts'],
    errors: ['line 5: Unexpected any'],
    ...props,
  });
