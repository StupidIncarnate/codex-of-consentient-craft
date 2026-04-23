import { questSourceContract } from './quest-source-contract';
import type { QuestSource } from './quest-source-contract';

export const QuestSourceStub = ({ value }: { value?: QuestSource } = {}): QuestSource =>
  questSourceContract.parse(value ?? 'user');
