import type { StubArgument } from '@dungeonmaster/shared/@types';
import { signalCliReturnInputContract } from './signal-cli-return-input-contract';
import type { SignalCliReturnInput } from './signal-cli-return-input-contract';

export const SignalCliReturnInputStub = ({
  ...props
}: StubArgument<SignalCliReturnInput> = {}): SignalCliReturnInput =>
  signalCliReturnInputContract.parse({
    screen: 'list',
    ...props,
  });
