import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';

import { questStartResponseContract } from './quest-start-response-contract';
import type { QuestStartResponse } from './quest-start-response-contract';

export const QuestStartResponseStub = ({
  ...props
}: StubArgument<QuestStartResponse> = {}): QuestStartResponse =>
  questStartResponseContract.parse({
    processId: ProcessIdStub(),
    ...props,
  });
