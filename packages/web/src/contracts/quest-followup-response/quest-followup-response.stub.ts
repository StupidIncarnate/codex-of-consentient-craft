import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { questFollowupResponseContract } from './quest-followup-response-contract';
import type { QuestFollowupResponse } from './quest-followup-response-contract';

export const QuestFollowupResponseStub = ({
  ...props
}: StubArgument<QuestFollowupResponse> = {}): QuestFollowupResponse =>
  questFollowupResponseContract.parse({
    chatProcessId: ProcessIdStub(),
    ...props,
  });
