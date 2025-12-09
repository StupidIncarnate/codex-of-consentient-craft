import type { StubArgument } from '@dungeonmaster/shared/@types';
import { execResultContract, type ExecResult } from './exec-result-contract';

export const ExecResultStub = ({ ...props }: StubArgument<ExecResult> = {}): ExecResult =>
  execResultContract.parse({
    stdout: '',
    stderr: '',
    exitCode: 0,
    ...props,
  });
