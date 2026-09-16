import type { StubArgument } from '@dungeonmaster/shared/@types';
import { opFilterContract } from './op-filter-contract';
import type { OpFilter } from './op-filter-contract';

export const OpFilterStub = ({ ...props }: StubArgument<OpFilter> = {}): OpFilter =>
  opFilterContract.parse({
    op: 'filter',
    ingredient: 'operation',
    where: { role: 'riftcarver' },
    expect: 'one',
    matchedRef: 'operation[0]',
    ops: [],
    ...props,
  });
