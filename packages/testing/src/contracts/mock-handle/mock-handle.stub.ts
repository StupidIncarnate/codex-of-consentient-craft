import type { StubArgument } from '@dungeonmaster/shared/@types';

import { MockStagingStub } from '../mock-staging/mock-staging.stub';
import { mockHandleContract } from './mock-handle-contract';
import type { MockHandle } from './mock-handle-contract';

export const MockHandleStub = ({ ...props }: StubArgument<MockHandle> = {}): MockHandle => {
  const { calledWith, onceFor, callsMatching, ...dataProps } = props;

  return {
    ...mockHandleContract.parse({
      ...dataProps,
    }),
    calledWith: calledWith ?? ((): ReturnType<MockHandle['calledWith']> => MockStagingStub()),
    onceFor: onceFor ?? ((): ReturnType<MockHandle['onceFor']> => MockStagingStub()),
    callsMatching: callsMatching ?? ((): ReturnType<MockHandle['callsMatching']> => []),
  };
};
