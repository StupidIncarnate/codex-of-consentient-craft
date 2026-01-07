import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questDatabaseContract } from './quest-database-contract';
import type { QuestDatabase } from './quest-database-contract';

export const QuestDatabaseStub = ({ ...props }: StubArgument<QuestDatabase> = {}): QuestDatabase =>
  questDatabaseContract.parse({
    quests: [],
    ...props,
  });
