import type { StubArgument } from '@dungeonmaster/shared/@types';

import { cleanupArgsContract } from './cleanup-args-contract';
import type { CleanupArgs } from './cleanup-args-contract';

export const CleanupArgsStub = ({ ...props }: StubArgument<CleanupArgs> = {}): CleanupArgs =>
  cleanupArgsContract.parse({
    human: false,
    ...props,
  });
