import type { StubArgument } from '@dungeonmaster/shared/@types';
import { signalBackResultContract } from './signal-back-result-contract';
import type { SignalBackResult } from './signal-back-result-contract';
import { SignalBackInputStub } from '../signal-back-input/signal-back-input.stub';

export const SignalBackResultStub = ({
  ...props
}: StubArgument<SignalBackResult> = {}): SignalBackResult =>
  signalBackResultContract.parse({
    success: true,
    signal: SignalBackInputStub(),
    ...props,
  });
