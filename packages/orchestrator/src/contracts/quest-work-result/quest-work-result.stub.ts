import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questWorkResultContract } from './quest-work-result-contract';
import type { QuestWorkResult } from './quest-work-result-contract';

export const QuestWorkResultStub = ({
  ...props
}: StubArgument<QuestWorkResult> = {}): QuestWorkResult =>
  questWorkResultContract.parse({
    kind: 'outcome',
    word: 'done',
    ...props,
  });
