import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stagedCallContract } from './staged-call-contract';
import type { StagedCall } from './staged-call-contract';

export const StagedCallStub = ({ ...props }: StubArgument<StagedCall> = {}): StagedCall => {
  const { impl, ...dataProps } = props;

  return {
    ...stagedCallContract.parse({
      args: [],
      once: false,
      consumed: false,
      ...dataProps,
    }),
    impl: impl ?? ((): undefined => undefined),
  };
};
