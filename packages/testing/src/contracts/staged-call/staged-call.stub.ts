import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stagedCallContract } from './staged-call-contract';
import type { StagedCall } from './staged-call-contract';

export const StagedCallStub = ({ ...props }: StubArgument<StagedCall> = {}): StagedCall => {
  const { impl, args, ...dataProps } = props;

  return {
    ...stagedCallContract.parse({
      once: false,
      consumed: false,
      ...dataProps,
    }),
    args: args ?? [],
    impl: impl ?? ((): undefined => undefined),
  };
};
