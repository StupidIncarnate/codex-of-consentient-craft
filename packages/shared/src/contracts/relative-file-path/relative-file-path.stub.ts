import { relativeFilePathContract, type RelativeFilePath } from './relative-file-path-contract';

export const RelativeFilePathStub = (value: string): RelativeFilePath =>
  relativeFilePathContract.parse(value);
