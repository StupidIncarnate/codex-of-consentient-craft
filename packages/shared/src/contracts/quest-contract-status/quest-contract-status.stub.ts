import { questContractStatusContract } from './quest-contract-status-contract';
import type { QuestContractStatus } from './quest-contract-status-contract';

export const QuestContractStatusStub = (
  { value }: { value: string } = { value: 'new' },
): QuestContractStatus => questContractStatusContract.parse(value);
