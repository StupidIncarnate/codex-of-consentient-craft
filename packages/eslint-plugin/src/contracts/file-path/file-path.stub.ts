import { filePathContract } from './file-path-contract';
import type { FilePath } from './file-path-contract';

export const FilePathStub = ({ value = '/test/file.ts' } = {}): FilePath =>
  filePathContract.parse(value);
