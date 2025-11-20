import { filePathContract } from './file-path-contract';
import type { FilePath } from './file-path-contract';

export const FilePathStub = ({ value }: { value: string }): FilePath =>
  filePathContract.parse(value);
