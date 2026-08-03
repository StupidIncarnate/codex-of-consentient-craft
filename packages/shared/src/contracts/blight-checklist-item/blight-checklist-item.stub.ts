import type { StubArgument } from '@dungeonmaster/shared/@types';

import { blightChecklistItemContract } from './blight-checklist-item-contract';
import type { BlightChecklistItem } from './blight-checklist-item-contract';

export const BlightChecklistItemStub = ({
  ...props
}: StubArgument<BlightChecklistItem> = {}): BlightChecklistItem =>
  blightChecklistItemContract.parse({
    id: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage',
    implPath: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
    concern: 'coverage',
    pairedFiles: ['packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx'],
    label: 'coverage — every branch in quest-chat-widget.tsx has a real test',
    ...props,
  });
