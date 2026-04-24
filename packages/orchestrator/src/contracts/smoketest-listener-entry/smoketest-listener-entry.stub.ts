import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestListenerEntryContract } from './smoketest-listener-entry-contract';
import type { SmoketestListenerEntry } from './smoketest-listener-entry-contract';

export const SmoketestListenerEntryStub = ({
  ...props
}: StubArgument<SmoketestListenerEntry> = {}): SmoketestListenerEntry =>
  smoketestListenerEntryContract.parse({
    assertions: [],
    isOrchestration: false,
    ...props,
  });
