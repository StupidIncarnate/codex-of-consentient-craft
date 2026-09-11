import type { StubArgument } from '@dungeonmaster/shared/@types';
import { fileTimingContract, type FileTiming } from './file-timing-contract';

export const FileTimingStub = ({ ...props }: StubArgument<FileTiming> = {}): FileTiming =>
  fileTimingContract.parse({
    filePath: 'src/index.ts',
    durationMs: 150,
    testMs: 20,
    slowestTestMs: 20,
    testCount: 1,
    rulesMs: 0,
    ...props,
  });
