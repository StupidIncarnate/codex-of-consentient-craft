import { qaChecklistItemIdContract } from './qa-checklist-item-id-contract';
import type { QaChecklistItemId } from './qa-checklist-item-id-contract';

export const QaChecklistItemIdStub = (
  { value }: { value: string } = {
    value: 'view-persisted-comments:observable:check-badge-count-text',
  },
): QaChecklistItemId => qaChecklistItemIdContract.parse(value);
