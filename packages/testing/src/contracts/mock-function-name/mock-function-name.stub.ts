import { mockFunctionNameContract } from './mock-function-name-contract';

export const MockFunctionNameStub = (
  { value }: { value: string } = { value: 'mockFn' },
): ReturnType<typeof mockFunctionNameContract.parse> => mockFunctionNameContract.parse(value);
