/**
 * PURPOSE: Stub factory for ExitCode branded number type
 *
 * USAGE:
 * const code = ExitCodeStub({ value: 0 });
 * // Returns branded ExitCode number
 */
import { exitCodeContract, type ExitCode } from './exit-code-contract';

export const ExitCodeStub = ({ value }: { value: number } = { value: 0 }): ExitCode =>
  exitCodeContract.parse(value);
