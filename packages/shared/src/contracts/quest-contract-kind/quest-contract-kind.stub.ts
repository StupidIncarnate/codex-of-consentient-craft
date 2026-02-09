import { questContractKindContract } from './quest-contract-kind-contract';
import type { QuestContractKind } from './quest-contract-kind-contract';

export const QuestContractKindStub = (
  { value }: { value: string } = { value: 'data' },
): QuestContractKind => questContractKindContract.parse(value);
