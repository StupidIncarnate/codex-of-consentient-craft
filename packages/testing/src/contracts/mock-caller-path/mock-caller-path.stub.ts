import { mockCallerPathContract } from './mock-caller-path-contract';

export const MockCallerPathStub = (
  { value }: { value: string } = { value: 'test-adapter' },
): ReturnType<typeof mockCallerPathContract.parse> => mockCallerPathContract.parse(value);
