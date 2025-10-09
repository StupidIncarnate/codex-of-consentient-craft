import { relativeFilePathContract, type RelativeFilePath } from './relative-file-path-contract';

export const RelativeFilePathStub = ({ value }: { value: unknown }): RelativeFilePath =>
  relativeFilePathContract.parse(value);
