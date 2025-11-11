import { commandOutputContract } from './command-output-contract';
import type { CommandOutput } from './command-output-contract';

export const CommandOutputStub = (
  { value }: { value: string } = { value: 'command output' },
): CommandOutput => commandOutputContract.parse(value);
