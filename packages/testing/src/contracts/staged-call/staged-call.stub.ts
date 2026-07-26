import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stagedCallContract } from './staged-call-contract';
import type { StagedCall } from './staged-call-contract';

export const StagedCallStub = ({ ...props }: StubArgument<StagedCall> = {}): StagedCall =>
  stagedCallContract.parse({
    args: [],
    impl: (): undefined => undefined,
    once: false,
    consumed: false,
    ...props,
  });
