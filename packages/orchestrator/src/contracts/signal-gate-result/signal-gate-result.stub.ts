import type { StubArgument } from '@dungeonmaster/shared/@types';

import { signalGateResultContract } from './signal-gate-result-contract';
import type { SignalGateResult } from './signal-gate-result-contract';

export const SignalGateResultStub = ({
  ...props
}: StubArgument<SignalGateResult> = {}): SignalGateResult =>
  signalGateResultContract.parse({
    ok: true,
    ...props,
  });
