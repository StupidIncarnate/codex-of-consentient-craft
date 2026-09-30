import type { BlightChecklistItem } from '../blight-checklist-item/blight-checklist-item-contract';
import { blightChecklistItemContract } from '../blight-checklist-item/blight-checklist-item-contract';

export const BlightChecklistItemIdStub = (
  { value }: { value: string } = {
    value: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:craft',
  },
): BlightChecklistItem['id'] => {
  const blightChecklistItemIdContract = blightChecklistItemContract.shape.id;
  return blightChecklistItemIdContract.parse(value);
};
