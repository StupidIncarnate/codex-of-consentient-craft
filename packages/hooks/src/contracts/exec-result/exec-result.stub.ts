/**
 * PURPOSE: Create stub ExecResult instances for testing
 *
 * USAGE:
 * const result = ExecResultStub({stdout: 'output', stderr: '', exitCode: 0});
 * // Returns valid ExecResult instance
 */

import { execResultContract, type ExecResult } from './exec-result-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const ExecResultStub = ({ ...props }: StubArgument<ExecResult> = {}): ExecResult =>
  execResultContract.parse({
    stdout: 'test output',
    stderr: '',
    exitCode: 0,
    ...props,
  });
