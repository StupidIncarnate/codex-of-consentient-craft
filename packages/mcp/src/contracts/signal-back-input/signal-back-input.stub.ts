import type { StubArgument } from '@dungeonmaster/shared/@types';
import { signalBackInputContract } from './signal-back-input-contract';
import type { SignalBackInput } from './signal-back-input-contract';
export const SignalBackInputStub = ({ ...props }: StubArgument<SignalBackInput> = {}): SignalBackInput =>
  signalBackInputContract.parse({
    signal: 'complete',
    summary: 'Step completed successfully',
    ...props,
  });
