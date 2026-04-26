import type { StubArgument } from '@dungeonmaster/shared/@types';
import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { wsIncomingMessageContract } from './ws-incoming-message-contract';
import type { WsIncomingMessage } from './ws-incoming-message-contract';

export const WsIncomingMessageStub = ({
  ...props
}: StubArgument<WsIncomingMessage> = {}): WsIncomingMessage =>
  wsIncomingMessageContract.parse({
    type: 'quest-by-session-request',
    sessionId: 'sess-1',
    guildId: GuildIdStub(),
    ...(props as object),
  });

export const WsReplayHistoryMessageStub = (): WsIncomingMessage =>
  wsIncomingMessageContract.parse({
    type: 'replay-history',
    sessionId: 'sess-1',
    guildId: GuildIdStub(),
    chatProcessId: 'proc-1',
  });

export const WsWardDetailRequestMessageStub = (): WsIncomingMessage =>
  wsIncomingMessageContract.parse({
    type: 'ward-detail-request',
    questId: QuestIdStub(),
    wardResultId: 'ward-result-1',
  });
