import type { QaChecklistItem } from '../qa-checklist-item/qa-checklist-item-contract';
import { qaChecklistItemContract } from '../qa-checklist-item/qa-checklist-item-contract';

export const UnitIdStub = (
  { value }: { value: string } = { value: 'send-flow:observable:check-badge-count-text' },
): QaChecklistItem['id'] => {
  const unitIdContract = qaChecklistItemContract.shape.id;
  return unitIdContract.parse(value);
};
