import { filePathContract, type FilePath } from './file-path-contract';

export const FilePathStub = (value: string): FilePath => filePathContract.parse(value);
