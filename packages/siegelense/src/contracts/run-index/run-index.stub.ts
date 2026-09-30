import type { StubArgument } from '@dungeonmaster/shared/@types';

import { runIndexContract } from './run-index-contract';
import type { RunIndex } from './run-index-contract';

export const RunIndexStub = ({ ...props }: StubArgument<RunIndex> = {}): RunIndex =>
  runIndexContract.parse({
    console: { errors: 0, warnings: 2 },
    server: { errors: 0 },
    network: { exchanges: 14, failed: 0 },
    ...props,
  });
