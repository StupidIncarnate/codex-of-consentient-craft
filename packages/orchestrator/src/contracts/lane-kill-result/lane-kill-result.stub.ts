import type { StubArgument } from '@dungeonmaster/shared/@types';

import { laneKillResultContract } from './lane-kill-result-contract';
import type { LaneKillResult } from './lane-kill-result-contract';

export const LaneKillResultStub = ({
  ...props
}: StubArgument<LaneKillResult> = {}): LaneKillResult =>
  laneKillResultContract.parse({
    stopped: true,
    ...props,
  });
