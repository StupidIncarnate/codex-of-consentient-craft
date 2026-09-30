import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questStartResponseContract } from './quest-start-response-contract';
import type { QuestStartResponse } from './quest-start-response-contract';

export const QuestStartResponseStub = ({
  ...props
}: StubArgument<QuestStartResponse> = {}): QuestStartResponse =>
  questStartResponseContract.parse({
    processId: 'proc-12345',
    ...props,
  });
