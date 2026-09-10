import type { StubArgument } from '@dungeonmaster/shared/@types';
import { testingOpenHandleFindingContract } from './testing-open-handle-finding-contract';
import type { TestingOpenHandleFinding } from './testing-open-handle-finding-contract';

export const TestingOpenHandleFindingStub = ({
  ...props
}: StubArgument<TestingOpenHandleFinding> = {}): TestingOpenHandleFinding =>
  testingOpenHandleFindingContract.parse({
    kind: 'setInterval',
    testPath: 'packages/a/src/poll.test.ts',
    stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
    ...props,
  });
