import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questFindBySessionResponseDataContract } from './quest-find-by-session-response-data-contract';
import type { QuestFindBySessionResponseData } from './quest-find-by-session-response-data-contract';

export const QuestFindBySessionResponseDataStub = ({
  ...props
}: StubArgument<QuestFindBySessionResponseData> = {}): QuestFindBySessionResponseData =>
  questFindBySessionResponseDataContract.parse({
    questId: 'add-auth',
    ...props,
  });
