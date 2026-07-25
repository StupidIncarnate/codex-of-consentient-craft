import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questResumeOutcomeContract } from './quest-resume-outcome-contract';
import type { QuestResumeOutcome } from './quest-resume-outcome-contract';

export const QuestResumeOutcomeStub = ({
  ...props
}: StubArgument<QuestResumeOutcome> = {}): QuestResumeOutcome =>
  questResumeOutcomeContract.parse({
    resumed: true,
    restoredStatus: 'in_progress',
    dispatch: { started: true },
    ...props,
  });
