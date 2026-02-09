import { questSectionContract } from './quest-section-contract';
import type { QuestSection } from './quest-section-contract';

export const QuestSectionStub = (
  { value }: { value: string } = { value: 'requirements' },
): QuestSection => questSectionContract.parse(value);
