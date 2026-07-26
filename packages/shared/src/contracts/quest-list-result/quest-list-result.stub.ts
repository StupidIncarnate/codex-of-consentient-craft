import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questListResultContract } from './quest-list-result-contract';
import type { QuestListResult } from './quest-list-result-contract';

export const QuestListResultStub = ({
  ...props
}: StubArgument<QuestListResult> = {}): QuestListResult =>
  questListResultContract.parse({
    quests: [],
    skipped: [],
    ...props,
  });
