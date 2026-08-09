import { questTitleContract } from './quest-title-contract';
import type { QuestTitle } from './quest-title-contract';

export const QuestTitleStub = (
  { value }: { value: string } = { value: 'Add Authentication' },
): QuestTitle => questTitleContract.parse(value);
