import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questWorkRecordResultContract } from './quest-work-record-result-contract';
import type { QuestWorkRecordResult } from './quest-work-record-result-contract';

export const QuestWorkRecordResultStub = ({
  ...props
}: StubArgument<QuestWorkRecordResult> = {}): QuestWorkRecordResult =>
  questWorkRecordResultContract.parse({
    kind: 'outcome',
    word: 'done',
    ...props,
  });
