import type { StubArgument } from '@dungeonmaster/shared/@types';
import { InstanceIdStub, StepStub } from '@dungeonmaster/siegelense/contracts';

import { siegelenseRunInputContract } from './siegelense-run-input-contract';
import type { SiegelenseRunInput } from './siegelense-run-input-contract';

export const SiegelenseRunInputStub = ({
  ...props
}: StubArgument<SiegelenseRunInput> = {}): SiegelenseRunInput =>
  siegelenseRunInputContract.parse({
    instanceId: InstanceIdStub(),
    steps: [StepStub()],
    ...props,
  });
