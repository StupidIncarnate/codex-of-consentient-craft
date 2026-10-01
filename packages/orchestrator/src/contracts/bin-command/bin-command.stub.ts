import type { StubArgument } from '@dungeonmaster/shared/@types';

import { binCommandContract } from './bin-command-contract';
import type { BinCommand } from './bin-command-contract';

export const BinCommandStub = ({ ...props }: StubArgument<BinCommand> = {}): BinCommand =>
  binCommandContract.parse({
    command: 'dungeonmaster-ward',
    leadingArgs: [],
    ...props,
  });
