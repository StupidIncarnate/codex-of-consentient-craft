import type { StubArgument } from '@dungeonmaster/shared/@types';

import { attrPairContract } from './attr-pair-contract';
import type { AttrPair } from './attr-pair-contract';

export const AttrPairStub = ({ ...props }: StubArgument<AttrPair> = {}): AttrPair =>
  attrPairContract.parse({
    name: 'data-status',
    value: 'failed',
    ...props,
  });
