import type { StubArgument } from '../../@types/stub-argument.type';

import { fileWriteCallContract } from './file-write-call-contract';
import type { FileWriteCall } from './file-write-call-contract';

export const FileWriteCallStub = ({ ...props }: StubArgument<FileWriteCall> = {}): FileWriteCall =>
  fileWriteCallContract.parse({
    adapter: 'fsWriteFileAdapter',
    filePathArg: '/stub/path/quest.json',
    ...props,
  });
