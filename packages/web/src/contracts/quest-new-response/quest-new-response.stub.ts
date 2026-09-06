import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

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
