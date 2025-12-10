import { questStatusContract } from './quest-status-contract';
import type { QuestStatus } from './quest-status-contract';

export const QuestStatusStub = ({ value }: { value?: QuestStatus } = {}): QuestStatus =>
  questStatusContract.parse(value ?? 'in_progress');
