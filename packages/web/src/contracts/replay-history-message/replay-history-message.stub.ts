import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub, ProcessIdStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { replayHistoryMessageContract } from './replay-history-message-contract';
import type { ReplayHistoryMessage } from './replay-history-message-contract';

export const ReplayHistoryMessageStub = ({
  ...props
}: StubArgument<ReplayHistoryMessage> = {}): ReplayHistoryMessage =>
  replayHistoryMessageContract.parse({
    type: 'replay-history',
    sessionId: SessionIdStub(),
    guildId: GuildIdStub(),
    chatProcessId: ProcessIdStub(),
    ...props,
  });
