import { filePathContract, type FilePath } from './file-path-contract';

export const FilePathStub = (value: string): FilePath => {
  return filePathContract.parse(value);
};
