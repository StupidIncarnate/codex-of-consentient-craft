import type { QuestContractEntry } from '../quest-contract-entry/quest-contract-entry-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';

export const QuestContractEntryIdStub = (
  { value }: { value: string } = { value: 'login-credentials' },
): QuestContractEntry['id'] => questContractEntryContract.shape.id.parse(value);
