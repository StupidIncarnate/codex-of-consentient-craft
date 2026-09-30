import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fileStatContract, type FileStat } from './file-stat-contract';

export const FileStatStub = ({ ...props }: StubArgument<FileStat> = {}): FileStat =>
  fileStatContract.parse({
    sizeBytes: 2048,
    modifiedAtMs: 1,
    ...props,
  });
