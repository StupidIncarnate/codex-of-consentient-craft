import type { StubArgument } from '@dungeonmaster/shared/@types';
import { InstanceIdStub } from '@dungeonmaster/siegelense/contracts';

import { siegelenseKillInputContract } from './siegelense-kill-input-contract';
import type { SiegelenseKillInput } from './siegelense-kill-input-contract';

export const SiegelenseKillInputStub = ({
  ...props
}: StubArgument<SiegelenseKillInput> = {}): SiegelenseKillInput =>
  siegelenseKillInputContract.parse({
    instanceId: InstanceIdStub(),
    ...props,
  });
