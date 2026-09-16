import type { StubArgument } from '@dungeonmaster/shared/@types';
import { InstanceIdStub, RunIdStub } from '@dungeonmaster/siegelense/contracts';

import { siegelenseCompareInputContract } from './siegelense-compare-input-contract';
import type { SiegelenseCompareInput } from './siegelense-compare-input-contract';

export const SiegelenseCompareInputStub = ({
  ...props
}: StubArgument<SiegelenseCompareInput> = {}): SiegelenseCompareInput =>
  siegelenseCompareInputContract.parse({
    instanceId: InstanceIdStub(),
    runA: RunIdStub({ value: 'run_4' }),
    runB: RunIdStub({ value: 'run_5' }),
    ...props,
  });
