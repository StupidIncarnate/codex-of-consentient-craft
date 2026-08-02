import { qaChecklistKindContract } from './qa-checklist-kind-contract';
import type { QaChecklistKind } from './qa-checklist-kind-contract';

export const QaChecklistKindStub = (
  { value }: { value: string } = { value: 'observable' },
): QaChecklistKind => qaChecklistKindContract.parse(value);
