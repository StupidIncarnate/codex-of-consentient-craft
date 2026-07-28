import { questSectionContract } from './quest-section-contract';
import type { QuestSection } from './quest-section-contract';

export const QuestSectionStub = (
  { value }: { value: string } = { value: 'designDecisions' },
): QuestSection => questSectionContract.parse(value);
