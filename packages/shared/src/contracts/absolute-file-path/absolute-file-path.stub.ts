import { absoluteFilePathContract, type AbsoluteFilePath } from './absolute-file-path-contract';

export const AbsoluteFilePathStub = (value: string): AbsoluteFilePath =>
  absoluteFilePathContract.parse(value);
