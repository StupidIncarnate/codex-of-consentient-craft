import { sourceFileNameContract } from './source-file-name-contract';

export const SourceFileNameStub = (
  { value }: { value: string } = { value: 'test.ts' },
): ReturnType<typeof sourceFileNameContract.parse> => sourceFileNameContract.parse(value);
