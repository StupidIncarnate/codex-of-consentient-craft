import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mockStagingContract } from './mock-staging-contract';
import type { MockStaging } from './mock-staging-contract';

export const MockStagingStub = ({ ...props }: StubArgument<MockStaging> = {}): MockStaging => {
  const { returns, resolves, rejects, throws, implement, ...dataProps } = props;

  return {
    ...mockStagingContract.parse({
      ...dataProps,
    }),
    returns: returns ?? ((): void => undefined),
    resolves: resolves ?? ((): void => undefined),
    rejects: rejects ?? ((): void => undefined),
    throws: throws ?? ((): void => undefined),
    implement: implement ?? ((): void => undefined),
  };
};
