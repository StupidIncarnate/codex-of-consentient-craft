import { filePathContract, type FilePath } from './file-path-contract';

export const FilePathStub = ({ value }: { value: unknown }): FilePath =>
  filePathContract.parse(value);
