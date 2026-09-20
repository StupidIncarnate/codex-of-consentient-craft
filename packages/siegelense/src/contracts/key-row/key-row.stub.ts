import type { StubArgument } from '@dungeonmaster/shared/@types';

import { keyRowContract } from './key-row-contract';
import type { KeyRow } from './key-row-contract';

export const KeyRowStub = ({ ...props }: StubArgument<KeyRow> = {}): KeyRow =>
  keyRowContract.parse({
    ref: 26,
    depth: 0,
    testId: 'subagent-chain-duration',
    tag: 'span',
    role: null,
    domId: null,
    sibling: null,
    text: '4m',
    value: null,
    placeholder: null,
    attrs: [],
    attrsDropped: 0,
    flags: [],
    flagDetail: {},
    ...props,
  });
