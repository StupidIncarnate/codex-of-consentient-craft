import type { StubArgument } from '@dungeonmaster/shared/@types';
import { passingTestContract, type PassingTest } from './passing-test-contract';

export const PassingTestStub = ({ ...props }: StubArgument<PassingTest> = {}): PassingTest =>
  passingTestContract.parse({
    suitePath: 'src/index.test.ts',
    testName: 'should return valid result',
    durationMs: 0,
    ...props,
  });
