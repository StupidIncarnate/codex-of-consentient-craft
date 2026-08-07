import { blightChecklistItemIdContract } from './blight-checklist-item-id-contract';
import type { BlightChecklistItemId } from './blight-checklist-item-id-contract';

export const BlightChecklistItemIdStub = (
  { value }: { value: string } = {
    value: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
  },
): BlightChecklistItemId => blightChecklistItemIdContract.parse(value);
