import type { QaChecklistItem } from '../qa-checklist-item/qa-checklist-item-contract';
import { qaChecklistItemContract } from '../qa-checklist-item/qa-checklist-item-contract';

export const QaChecklistItemIdStub = (
  { value }: { value: string } = {
    value: 'view-persisted-comments:observable:check-badge-count-text',
  },
): QaChecklistItem['id'] => {
  const qaChecklistItemIdContract = qaChecklistItemContract.shape.id;
  return qaChecklistItemIdContract.parse(value);
};
