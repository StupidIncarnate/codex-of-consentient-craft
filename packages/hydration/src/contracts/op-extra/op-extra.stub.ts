import type { StubArgument } from '@dungeonmaster/shared/@types';
import { opExtraContract } from './op-extra-contract';
import type { OpExtra } from './op-extra-contract';

export const OpExtraStub = ({ ...props }: StubArgument<OpExtra> = {}): OpExtra =>
  opExtraContract.parse({
    op: 'extra',
    ref: 'session[0:0]',
    verb: 'withNestedChain',
    args: { depth: 2 },
    ...props,
  });
