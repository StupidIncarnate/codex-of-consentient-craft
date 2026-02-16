import type { StubArgument } from '@dungeonmaster/shared/@types';
import { testFailureContract, type TestFailure } from './test-failure-contract';

export const TestFailureStub = ({ ...props }: StubArgument<TestFailure> = {}): TestFailure =>
  testFailureContract.parse({
    suitePath: 'src/index.test.ts',
    testName: 'should return valid result',
    message: 'Expected true to be false',
    ...props,
  });
