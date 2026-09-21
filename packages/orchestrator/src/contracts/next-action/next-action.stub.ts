import type { StubArgument } from '@dungeonmaster/shared/@types';

import { MintedWorkItemStub } from '../minted-work-item/minted-work-item.stub';

import { nextActionContract } from './next-action-contract';
import type { NextAction } from './next-action-contract';

export const NextActionStub = ({ ...props }: StubArgument<NextAction> = {}): NextAction =>
  nextActionContract.parse({
    kind: 'mint',
    operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
    step: 'work',
    cause: 'plan-batch',
    batch: [MintedWorkItemStub()],
    ...props,
  });
