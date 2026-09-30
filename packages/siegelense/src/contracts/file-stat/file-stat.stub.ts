import type { StubArgument } from '@dungeonmaster/shared/@types';

import { FileSizeBytesStub } from '../file-size-bytes/file-size-bytes.stub';
import { fileStatContract, type FileStat } from './file-stat-contract';

export const FileStatStub = ({ ...props }: StubArgument<FileStat> = {}): FileStat =>
  fileStatContract.parse({
    sizeBytes: FileSizeBytesStub(),
    modifiedAtMs: 1,
    ...props,
  });
