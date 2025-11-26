import { baseNameContract } from './base-name-contract';

export const BaseNameStub = (
  { value }: { value: string } = { value: 'test-project' },
): ReturnType<typeof baseNameContract.parse> => baseNameContract.parse(value);
