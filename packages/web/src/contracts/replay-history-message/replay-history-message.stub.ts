import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { replayHistoryMessageContract } from './replay-history-message-contract';
import type { ReplayHistoryMessage } from './replay-history-message-contract';

export const ReplayHistoryMessageStub = ({
  ...props
}: StubArgument<ReplayHistoryMessage> = {}): ReplayHistoryMessage =>
  replayHistoryMessageContract.parse({
    type: 'replay-history',
    sessionId: SessionIdStub(),
    guildId: GuildIdStub(),
    chatProcessId: 'proc-12345',
    ...props,
  });
