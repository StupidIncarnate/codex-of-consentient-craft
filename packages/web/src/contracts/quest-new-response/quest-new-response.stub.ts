import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { questNewResponseContract } from './quest-new-response-contract';
import type { QuestNewResponse } from './quest-new-response-contract';

export const QuestNewResponseStub = ({
  ...props
}: StubArgument<QuestNewResponse> = {}): QuestNewResponse =>
  questNewResponseContract.parse({
    questId: QuestIdStub(),
    chatProcessId: 'proc-12345',
    ...props,
  });
