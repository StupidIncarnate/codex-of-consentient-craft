import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dispatchPlayGateResultContract } from './dispatch-play-gate-result-contract';
import type { DispatchPlayGateResult } from './dispatch-play-gate-result-contract';

export const DispatchPlayGateResultStub = ({
  ...props
}: StubArgument<DispatchPlayGateResult> = {}): DispatchPlayGateResult =>
  dispatchPlayGateResultContract.parse({
    allowed: true,
    ...props,
  });
