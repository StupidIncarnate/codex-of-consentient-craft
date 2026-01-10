import type { StubArgument } from '@dungeonmaster/shared/@types';
import { signalCliReturnResultContract } from './signal-cli-return-result-contract';
import type { SignalCliReturnResult } from './signal-cli-return-result-contract';

export const SignalCliReturnResultStub = ({
  ...props
}: StubArgument<SignalCliReturnResult> = {}): SignalCliReturnResult =>
  signalCliReturnResultContract.parse({
    success: true,
    signalPath: '/project/.dungeonmaster-quests/.cli-signal',
    ...props,
  });
