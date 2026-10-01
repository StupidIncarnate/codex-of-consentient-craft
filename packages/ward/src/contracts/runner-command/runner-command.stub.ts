import type { StubArgument } from '@dungeonmaster/shared/@types';
import { runnerCommandContract, type RunnerCommand } from './runner-command-contract';

export const RunnerCommandStub = ({ ...props }: StubArgument<RunnerCommand> = {}): RunnerCommand =>
  runnerCommandContract.parse({
    command: '/project/node_modules/.bin/jest',
    leadingArgs: [],
    ...props,
  });
