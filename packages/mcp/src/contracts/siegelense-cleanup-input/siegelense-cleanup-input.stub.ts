import type { StubArgument } from '@dungeonmaster/shared/@types';

import { siegelenseCleanupInputContract } from './siegelense-cleanup-input-contract';
import type { SiegelenseCleanupInput } from './siegelense-cleanup-input-contract';

export const SiegelenseCleanupInputStub = ({
  ...props
}: StubArgument<SiegelenseCleanupInput> = {}): SiegelenseCleanupInput =>
  siegelenseCleanupInputContract.parse({
    ...props,
  });
