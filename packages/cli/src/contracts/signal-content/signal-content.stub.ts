import type { StubArgument } from '@dungeonmaster/shared/@types';
import { signalContentContract } from './signal-content-contract';
import type { SignalContent, QuestSignal, ReturnSignal } from './signal-content-contract';

export const SignalContentStub = ({ ...props }: StubArgument<QuestSignal> = {}): SignalContent =>
  signalContentContract.parse({
    type: 'quest-complete',
    ...props,
  });

export const ReturnSignalStub = ({ ...props }: StubArgument<ReturnSignal> = {}): SignalContent =>
  signalContentContract.parse({
    action: 'return',
    screen: 'list',
    timestamp: new Date().toISOString(),
    ...props,
  });
