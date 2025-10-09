import { absoluteFilePathContract, type AbsoluteFilePath } from './absolute-file-path-contract';

export const AbsoluteFilePathStub = ({ value }: { value: unknown }): AbsoluteFilePath =>
  absoluteFilePathContract.parse(value);
