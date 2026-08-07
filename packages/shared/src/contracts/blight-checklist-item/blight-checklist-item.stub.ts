import type { StubArgument } from '@dungeonmaster/shared/@types';

import { blightChecklistItemContract } from './blight-checklist-item-contract';
import type { BlightChecklistItem } from './blight-checklist-item-contract';

export const BlightChecklistItemStub = ({
  ...props
}: StubArgument<BlightChecklistItem> = {}): BlightChecklistItem =>
  blightChecklistItemContract.parse({
    id: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
    implPath: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
    concern: 'craft',
    pairedFiles: ['packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx'],
    label:
      "craft — quest-chat-widget.tsx's logic matches its signature and its error handling carries real context",
    ...props,
  });
