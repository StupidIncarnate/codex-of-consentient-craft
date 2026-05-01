import type { StubArgument } from '../../@types/stub-argument.type';

import { stateWritesResultContract } from './state-writes-result-contract';
import type { StateWritesResult } from './state-writes-result-contract';

export const StateWritesResultStub = ({
  ...props
}: StubArgument<StateWritesResult> = {}): StateWritesResult =>
  stateWritesResultContract.parse({
    inMemoryStores: [],
    fileWrites: [],
    browserStorageWrites: [],
    ...props,
  });
