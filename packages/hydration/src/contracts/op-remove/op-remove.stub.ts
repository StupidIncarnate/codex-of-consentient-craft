import type { StubArgument } from '@dungeonmaster/shared/@types';
import { opRemoveContract } from './op-remove-contract';
import type { OpRemove } from './op-remove-contract';

export const OpRemoveStub = ({ ...props }: StubArgument<OpRemove> = {}): OpRemove =>
  opRemoveContract.parse({
    op: 'remove',
    ref: 'guild[0:0]/quest[0:1]',
    ...props,
  });
