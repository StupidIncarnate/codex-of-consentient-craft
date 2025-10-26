import { absoluteFilePathContract } from './absolute-file-path-contract';
import type { AbsoluteFilePath } from './absolute-file-path-contract';

export const AbsoluteFilePathStub = (
  { value }: { value: string } = { value: '/home/user/project/src/file.ts' },
): AbsoluteFilePath => absoluteFilePathContract.parse(value);
