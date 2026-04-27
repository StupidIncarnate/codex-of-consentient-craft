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

export const WsSubscribeQuestMessageStub = (): WsIncomingMessage =>
  wsIncomingMessageContract.parse({
    type: 'subscribe-quest',
    questId: QuestIdStub(),
  });

export const WsUnsubscribeQuestMessageStub = (): WsIncomingMessage =>
  wsIncomingMessageContract.parse({
    type: 'unsubscribe-quest',
    questId: QuestIdStub(),
  });

export const WsReplayQuestHistoryMessageStub = (): WsIncomingMessage =>
  wsIncomingMessageContract.parse({
    type: 'replay-quest-history',
    questId: QuestIdStub(),
  });
