import type { StubArgument } from '@dungeonmaster/shared/@types';
import { InstanceIdStub } from '@dungeonmaster/siegelense/contracts';

import { siegelenseResultsInputContract } from './siegelense-results-input-contract';
import type { SiegelenseResultsInput } from './siegelense-results-input-contract';

export const SiegelenseResultsInputStub = ({
  ...props
}: StubArgument<SiegelenseResultsInput> = {}): SiegelenseResultsInput =>
  siegelenseResultsInputContract.parse({
    instanceId: InstanceIdStub(),
    ...props,
  });
