import { questSelectionIndexContract } from './quest-selection-index-contract';
import type { QuestSelectionIndex } from './quest-selection-index-contract';

export const QuestSelectionIndexStub = (
  { value }: { value: number } = { value: 0 },
): QuestSelectionIndex => questSelectionIndexContract.parse(value);
