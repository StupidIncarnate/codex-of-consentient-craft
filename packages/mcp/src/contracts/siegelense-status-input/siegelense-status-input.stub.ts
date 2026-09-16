import type { StubArgument } from '@dungeonmaster/shared/@types';

import { siegelenseStatusInputContract } from './siegelense-status-input-contract';
import type { SiegelenseStatusInput } from './siegelense-status-input-contract';

export const SiegelenseStatusInputStub = ({
  ...props
}: StubArgument<SiegelenseStatusInput> = {}): SiegelenseStatusInput =>
  siegelenseStatusInputContract.parse({
    ...props,
  });
