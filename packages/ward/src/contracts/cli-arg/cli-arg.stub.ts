import { cliArgContract } from './cli-arg-contract';
import type { CliArg } from './cli-arg-contract';

export const CliArgStub = ({ value }: { value?: string } = {}): CliArg =>
  cliArgContract.parse(value ?? '--verbose');
