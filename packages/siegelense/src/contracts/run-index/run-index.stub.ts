import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { runIndexContract } from './run-index-contract';
import type { RunIndex } from './run-index-contract';

export const RunIndexStub = ({ ...props }: StubArgument<RunIndex> = {}): RunIndex =>
  runIndexContract.parse({
    console: { errors: ReadingCountStub({ value: 0 }), warnings: ReadingCountStub({ value: 2 }) },
    server: { errors: ReadingCountStub({ value: 0 }) },
    network: { exchanges: ReadingCountStub({ value: 14 }), non2xx: ReadingCountStub({ value: 0 }) },
    ...props,
  });
