import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  questBySessionResponseContract,
  type QuestBySessionResponse,
} from './quest-by-session-response-contract';

export const QuestBySessionResponseStub = ({
  ...props
}: StubArgument<QuestBySessionResponse> = {}): QuestBySessionResponse =>
  questBySessionResponseContract.parse({
    questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ...props,
  });
