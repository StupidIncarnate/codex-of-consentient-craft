import { questTypeContract } from './quest-type-contract';
import type { QuestType } from './quest-type-contract';

export const QuestTypeStub = ({ value }: { value?: QuestType } = {}): QuestType =>
  questTypeContract.parse(value ?? 'feature');
