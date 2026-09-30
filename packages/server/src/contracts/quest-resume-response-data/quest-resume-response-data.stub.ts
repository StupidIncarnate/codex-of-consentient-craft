import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questResumeResponseDataContract } from './quest-resume-response-data-contract';
import type { QuestResumeResponseData } from './quest-resume-response-data-contract';

export const QuestResumeResponseDataStub = ({
  ...props
}: StubArgument<QuestResumeResponseData> = {}): QuestResumeResponseData =>
  questResumeResponseDataContract.parse({
    dispatch: { started: true },
    resumed: true,
    restoredStatus: 'in_progress',
    ...props,
  });
