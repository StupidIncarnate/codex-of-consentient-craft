import type { StubArgument } from '@dungeonmaster/shared/@types';
import { openHandleFindingContract } from './open-handle-finding-contract';
import type { OpenHandleFinding } from './open-handle-finding-contract';

export const OpenHandleFindingStub = ({
  ...props
}: StubArgument<OpenHandleFinding> = {}): OpenHandleFinding =>
  openHandleFindingContract.parse({
    kind: 'setInterval',
    testPath: 'packages/testing/src/example.test.ts',
    stack: 'at exampleBroker (packages/testing/src/example-broker.ts:12:3)',
    ...props,
  });
