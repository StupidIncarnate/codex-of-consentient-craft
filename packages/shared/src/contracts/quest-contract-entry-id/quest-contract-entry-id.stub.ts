import { questContractEntryIdContract } from './quest-contract-entry-id-contract';
import type { QuestContractEntryId } from './quest-contract-entry-id-contract';

export const QuestContractEntryIdStub = (
  { value }: { value: string } = { value: 'login-credentials' },
): QuestContractEntryId => questContractEntryIdContract.parse(value);
