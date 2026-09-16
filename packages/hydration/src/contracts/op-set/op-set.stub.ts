import type { StubArgument } from '@dungeonmaster/shared/@types';
import { opSetContract } from './op-set-contract';
import type { OpSet } from './op-set-contract';

export const OpSetStub = ({ ...props }: StubArgument<OpSet> = {}): OpSet =>
  opSetContract.parse({
    op: 'set',
    ref: 'guild[0]/quest[2]',
    written: { title: 'The running one' },
    ...props,
  });
