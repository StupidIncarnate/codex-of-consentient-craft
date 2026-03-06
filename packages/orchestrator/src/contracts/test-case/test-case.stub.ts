import type { StubArgument } from '@dungeonmaster/shared/@types';

import { testCaseContract } from './test-case-contract';
import type { TestCase } from './test-case-contract';

export const TestCaseStub = ({ ...props }: StubArgument<TestCase> = {}): TestCase =>
  testCaseContract.parse({
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    flowId: 'c23bd10b-58cc-4372-a567-0e02b2c3d479',
    terminalNodeId: 'end-state',
    steps: [],
    ...props,
  });
