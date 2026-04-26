import type { StubArgument } from '@dungeonmaster/shared/@types';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';

import { questBySessionNotFoundPayloadContract } from './quest-by-session-not-found-payload-contract';
import type { QuestBySessionNotFoundPayload } from './quest-by-session-not-found-payload-contract';

export const QuestBySessionNotFoundPayloadStub = ({
  ...props
}: StubArgument<QuestBySessionNotFoundPayload> = {}): QuestBySessionNotFoundPayload =>
  questBySessionNotFoundPayloadContract.parse({
    sessionId: SessionIdStub(),
    ...props,
  });
