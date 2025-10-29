import { commandResultContract } from './command-result-contract';
import type { CommandResult } from './command-result-contract';
import type { StubArgument } from '@questmaestro/shared/@types';
import { ExitCodeStub } from '../exit-code/exit-code.stub';
import { ProcessOutputStub } from '../process-output/process-output.stub';

export const CommandResultStub = ({ ...props }: StubArgument<CommandResult> = {}): CommandResult =>
  commandResultContract.parse({
    exitCode: ExitCodeStub({ value: 0 }),
    stdout: ProcessOutputStub({ value: '' }),
    stderr: ProcessOutputStub({ value: '' }),
    ...props,
  });
