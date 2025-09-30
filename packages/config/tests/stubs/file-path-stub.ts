import { filePathContract, type FilePath } from '../../src/contracts/file-path/file-path-contract';

export const FilePathStub = (value: string): FilePath => {
  return filePathContract.parse(value);
};
