import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mintedWorkItemContract } from './minted-work-item-contract';
import type { MintedWorkItem } from './minted-work-item-contract';

export const MintedWorkItemStub = ({
  ...props
}: StubArgument<MintedWorkItem> = {}): MintedWorkItem =>
  mintedWorkItemContract.parse({
    step: 'work',
    role: 'codeweaver',
    assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
    needsLane: false,
    ...props,
  });
