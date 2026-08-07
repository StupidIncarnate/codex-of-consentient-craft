import type { StubArgument } from '@dungeonmaster/shared/@types';

import { BlightChecklistItemStub } from '../blight-checklist-item/blight-checklist-item.stub';
import { blightChecklistContract } from './blight-checklist-contract';
import type { BlightChecklist } from './blight-checklist-contract';

export const BlightChecklistStub = ({
  ...props
}: StubArgument<BlightChecklist> = {}): BlightChecklist =>
  blightChecklistContract.parse({
    baseRef: 'a1b2c3d4e5f6',
    items: [BlightChecklistItemStub()],
    remainingItemIds: ['packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft'],
    ...props,
  });
