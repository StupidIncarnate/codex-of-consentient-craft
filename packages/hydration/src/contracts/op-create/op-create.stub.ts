import type { StubArgument } from '@dungeonmaster/shared/@types';
import { opCreateContract } from './op-create-contract';
import type { OpCreate } from './op-create-contract';

export const OpCreateStub = ({ ...props }: StubArgument<OpCreate> = {}): OpCreate =>
  opCreateContract.parse({
    op: 'create',
    ingredient: 'quest',
    ref: 'guild[0]/quest[2]',
    index: 2,
    ancestors: ['guild[0]'],
    fields: { title: 'The running one' },
    ...props,
  });
