import type { StubArgument } from '@dungeonmaster/shared/@types';
import { mockCallContract } from './mock-call-contract';
import type { MockCall } from './mock-call-contract';

export const MockCallStub = ({ ...props }: StubArgument<MockCall> = {}): MockCall =>
  mockCallContract.parse({
    moduleName: 'fs',
    factory: null,
    sourceFile: 'test.proxy.ts',
    identifierNames: [],
    objectIdentifierNames: [],
    ...props,
  });
