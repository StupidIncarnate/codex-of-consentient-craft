import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { questNewResponseContract } from './quest-new-response-contract';
import type { QuestNewResponse } from './quest-new-response-contract';

export const QuestNewResponseStub = ({
  ...props
}: StubArgument<QuestNewResponse> = {}): QuestNewResponse =>
  questNewResponseContract.parse({
    questId: QuestIdStub(),
    chatProcessId: ProcessIdStub(),
    ...props,
  });
