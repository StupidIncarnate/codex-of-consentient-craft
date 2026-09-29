import type { StubArgument } from '@dungeonmaster/shared/@types';

import { rawSettleProbeContract } from './raw-settle-probe-contract';
import type { RawSettleProbe } from './raw-settle-probe-contract';

export const RawSettleProbeStub = ({
  ...props
}: StubArgument<RawSettleProbe> = {}): RawSettleProbe =>
  rawSettleProbeContract.parse({
    nowMs: 1_700_000_000_000,
    lastMutationAtMs: null,
    runningAnimations: 0,
    ...props,
  });
