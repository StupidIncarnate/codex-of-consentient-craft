import type { StubArgument } from '@dungeonmaster/shared/@types';
import { cliSignalContract } from './cli-signal-contract';
import type { CliSignal } from './cli-signal-contract';

export const CliSignalStub = ({ ...props }: StubArgument<CliSignal> = {}): CliSignal =>
  cliSignalContract.parse({
    action: 'return',
    screen: 'list',
    timestamp: '2024-01-01T00:00:00.000Z',
    ...props,
  });
