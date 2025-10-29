import { exitCodeContract } from './exit-code-contract';
import type { ExitCode } from './exit-code-contract';

export const ExitCodeStub = ({ value }: { value: number } = { value: 0 }): ExitCode =>
  exitCodeContract.parse(value);
