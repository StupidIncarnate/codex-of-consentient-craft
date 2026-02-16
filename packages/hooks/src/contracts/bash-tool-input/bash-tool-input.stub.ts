import type { BashToolInput } from './bash-tool-input-contract';
import { bashToolInputContract } from './bash-tool-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const BashToolInputStub = ({ ...props }: StubArgument<BashToolInput> = {}): BashToolInput =>
  bashToolInputContract.parse({
    command: 'echo hello',
    ...props,
  });
