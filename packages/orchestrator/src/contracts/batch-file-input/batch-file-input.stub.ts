import type { StubArgument } from '@dungeonmaster/shared/@types';

import { batchFileInputContract } from './batch-file-input-contract';
import type { BatchFileInput } from './batch-file-input-contract';

export const BatchFileInputStub = ({
  ...props
}: StubArgument<BatchFileInput> = {}): BatchFileInput =>
  batchFileInputContract.parse({
    filePaths: ['/src/brokers/test/test-broker.ts'],
    errors: ['line 5: Unexpected any'],
    ...props,
  });
