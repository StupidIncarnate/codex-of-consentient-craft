import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mockHandleEntryContract } from './mock-handle-entry-contract';
import type { MockHandleEntry } from './mock-handle-entry-contract';
import { MockCallerPathStub } from '../mock-caller-path/mock-caller-path.stub';

export const MockHandleEntryStub = ({
  ...props
}: StubArgument<MockHandleEntry> = {}): MockHandleEntry =>
  mockHandleEntryContract.parse({
    callerPath: MockCallerPathStub(),
    baseImpl: null,
    onceQueue: [],
    calls: [],
    ...props,
  });
