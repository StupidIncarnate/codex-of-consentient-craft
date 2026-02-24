import { join as _join } from 'path';

jest.mock('@dungeonmaster/orchestrator', () => ({
  __esModule: true,
  ...jest.requireActual('@dungeonmaster/orchestrator'),
  StartOrchestrator: {
    listGuilds: jest.fn(),
    addGuild: jest.fn(),
    getGuild: jest.fn(),
    updateGuild: jest.fn(),
    removeGuild: jest.fn(),
    browseDirectories: jest.fn(),
    listQuests: jest.fn(),
    getQuest: jest.fn(),
    addQuest: jest.fn(),
    modifyQuest: jest.fn(),
    verifyQuest: jest.fn(),
    startQuest: jest.fn(),
    getQuestStatus: jest.fn(),
    startChat: jest.fn(),
    stopChat: jest.fn(),
    stopAllChats: jest.fn(),
  },
}));
jest.mock('path');

import type {
  AddQuestResult,
  GetQuestResult,
  ModifyQuestResult,
  VerifyQuestResult,
} from '@dungeonmaster/orchestrator';
import type {
  ProcessIdStub,
  OrchestrationStatusStub,
  QuestListItemStub,
  GuildListItemStub,
  GuildStub,
  DirectoryEntryStub,
  WsMessage,
} from '@dungeonmaster/shared/contracts';
import { GuildListResponderProxy } from '../responders/guild/list/guild-list-responder.proxy';
import { GuildAddResponderProxy } from '../responders/guild/add/guild-add-responder.proxy';
import { GuildGetResponderProxy } from '../responders/guild/get/guild-get-responder.proxy';
import { GuildUpdateResponderProxy } from '../responders/guild/update/guild-update-responder.proxy';
import { GuildRemoveResponderProxy } from '../responders/guild/remove/guild-remove-responder.proxy';
import { SessionNewResponderProxy } from '../responders/session/new/session-new-responder.proxy';
import { DirectoryBrowseResponderProxy } from '../responders/directory/browse/directory-browse-responder.proxy';
import { QuestListResponderProxy } from '../responders/quest/list/quest-list-responder.proxy';
import { QuestGetResponderProxy } from '../responders/quest/get/quest-get-responder.proxy';
import { QuestAddResponderProxy } from '../responders/quest/add/quest-add-responder.proxy';
import { QuestModifyResponderProxy } from '../responders/quest/modify/quest-modify-responder.proxy';
import { QuestVerifyResponderProxy } from '../responders/quest/verify/quest-verify-responder.proxy';
import { QuestStartResponderProxy } from '../responders/quest/start/quest-start-responder.proxy';
import { ProcessStatusResponderProxy } from '../responders/process/status/process-status-responder.proxy';
import { ProcessOutputResponderProxy } from '../responders/process/output/process-output-responder.proxy';
import { SessionListResponderProxy } from '../responders/session/list/session-list-responder.proxy';
import { SessionChatResponderProxy } from '../responders/session/chat/session-chat-responder.proxy';
import { SessionChatStopResponderProxy } from '../responders/session/chat-stop/session-chat-stop-responder.proxy';
import { SessionChatHistoryResponderProxy } from '../responders/session/chat-history/session-chat-history-responder.proxy';
import { honoServeAdapterProxy } from '../adapters/hono/serve/hono-serve-adapter.proxy';
import { honoCreateNodeWebSocketAdapterProxy } from '../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.proxy';
import { agentOutputBufferStateProxy } from '../state/agent-output-buffer/agent-output-buffer-state.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { processDevLogAdapterProxy } from '../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { orchestratorStopAllChatsAdapterProxy } from '../adapters/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter.proxy';
import { StartServer } from './start-server';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Guild = ReturnType<typeof GuildStub>;
type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const StartServerProxy = (): {
  request: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  setupListGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupListGuildsError: (params: { error: Error }) => void;
  setupAddGuild: (params: { guild: Guild }) => void;
  setupAddGuildError: (params: { error: Error }) => void;
  setupGetGuild: (params: { guild: Guild }) => void;
  setupGetGuildError: (params: { error: Error }) => void;
  setupUpdateGuild: (params: { guild: Guild }) => void;
  setupUpdateGuildError: (params: { error: Error }) => void;
  setupRemoveGuildError: (params: { error: Error }) => void;
  setupBrowseDirectories: (params: { entries: DirectoryEntry[] }) => void;
  setupBrowseDirectoriesError: (params: { error: Error }) => void;
  setupListQuests: (params: { quests: QuestListItem[] }) => void;
  setupListQuestsError: (params: { error: Error }) => void;
  setupGetQuest: (params: { result: GetQuestResult }) => void;
  setupGetQuestError: (params: { error: Error }) => void;
  setupAddQuest: (params: { result: AddQuestResult }) => void;
  setupAddQuestError: (params: { error: Error }) => void;
  setupModifyQuest: (params: { result: ModifyQuestResult }) => void;
  setupModifyQuestError: (params: { error: Error }) => void;
  setupVerifyQuest: (params: { result: VerifyQuestResult }) => void;
  setupVerifyQuestError: (params: { error: Error }) => void;
  setupStartQuest: (params: { processId: ProcessId }) => void;
  setupStartQuestError: (params: { error: Error }) => void;
  setupGetQuestStatus: (params: { status: OrchestrationStatus }) => void;
  setupGetQuestStatusError: (params: { error: Error }) => void;
  setupJsonlContent: (params: { content: string }) => void;
  setupJsonlError: (params: { error: Error }) => void;
  setupSubagentReaddir: (params: { files: string[] }) => void;
  setupStartChat: (params: { chatProcessId: ProcessId }) => void;
  setupStartChatError: (params: { error: Error }) => void;
  setupStopChat: (params: { stopped: boolean }) => void;
  getBroadcastedMessages: () => WsMessage[];
} => {
  const serveProxy = honoServeAdapterProxy();
  const wsProxy = honoCreateNodeWebSocketAdapterProxy();
  jest.mocked(_join).mockImplementation((...segments) => segments.join('/'));
  agentOutputBufferStateProxy();
  orchestratorStopAllChatsAdapterProxy();
  const broadcastProxy = wsEventRelayBroadcastBrokerProxy();
  processDevLogAdapterProxy();

  const guildListProxy = GuildListResponderProxy();
  const guildAddProxy = GuildAddResponderProxy();
  const guildGetProxy = GuildGetResponderProxy();
  const guildUpdateProxy = GuildUpdateResponderProxy();
  const guildRemoveProxy = GuildRemoveResponderProxy();
  const sessionNewProxy = SessionNewResponderProxy();
  const directoryBrowseProxy = DirectoryBrowseResponderProxy();
  const questListProxy = QuestListResponderProxy();
  const questGetProxy = QuestGetResponderProxy();
  const questAddProxy = QuestAddResponderProxy();
  const questModifyProxy = QuestModifyResponderProxy();
  const questVerifyProxy = QuestVerifyResponderProxy();
  const questStartProxy = QuestStartResponderProxy();
  const processStatusProxy = ProcessStatusResponderProxy();
  ProcessOutputResponderProxy();
  SessionListResponderProxy();
  const sessionChatProxy = SessionChatResponderProxy();
  const sessionChatStopProxy = SessionChatStopResponderProxy();
  const chatHistoryProxy = SessionChatHistoryResponderProxy();

  jest.useFakeTimers();
  StartServer();
  jest.useRealTimers();

  wsProxy.simulateConnection({ client: broadcastProxy.captureClient });

  const capturedFetch = serveProxy.getCapturedFetch();

  return {
    request: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? `http://localhost${input}` : input;
      const request = new Request(url, init);
      return capturedFetch(request);
    },
    setupListGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      guildListProxy.setupListGuilds({ guilds });
    },
    setupListGuildsError: ({ error }: { error: Error }): void => {
      guildListProxy.setupListGuildsError({ message: error.message });
    },
    setupAddGuild: ({ guild }: { guild: Guild }): void => {
      guildAddProxy.setupAddGuild({ guild });
    },
    setupAddGuildError: ({ error }: { error: Error }): void => {
      guildAddProxy.setupAddGuildError({ message: error.message });
    },
    setupGetGuild: ({ guild }: { guild: Guild }): void => {
      guildGetProxy.setupGetGuild({ guild });
    },
    setupGetGuildError: ({ error }: { error: Error }): void => {
      guildGetProxy.setupGetGuildError({ message: error.message });
    },
    setupUpdateGuild: ({ guild }: { guild: Guild }): void => {
      guildUpdateProxy.setupUpdateGuild({ guild });
    },
    setupUpdateGuildError: ({ error }: { error: Error }): void => {
      guildUpdateProxy.setupUpdateGuildError({ message: error.message });
    },
    setupRemoveGuildError: ({ error }: { error: Error }): void => {
      guildRemoveProxy.setupRemoveGuildError({ message: error.message });
    },
    setupBrowseDirectories: ({ entries }: { entries: DirectoryEntry[] }): void => {
      directoryBrowseProxy.setupBrowse({ entries });
    },
    setupBrowseDirectoriesError: ({ error }: { error: Error }): void => {
      directoryBrowseProxy.setupBrowseError({ message: error.message });
    },
    setupListQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      questListProxy.setupListQuests({ quests });
    },
    setupListQuestsError: ({ error }: { error: Error }): void => {
      questListProxy.setupListQuestsError({ message: error.message });
    },
    setupGetQuest: ({ result }: { result: GetQuestResult }): void => {
      questGetProxy.setupGetQuest({ quest: result as never });
    },
    setupGetQuestError: ({ error }: { error: Error }): void => {
      questGetProxy.setupGetQuestError({ message: error.message });
    },
    setupAddQuest: ({ result: _result }: { result: AddQuestResult }): void => {
      questAddProxy.setupAddQuest();
    },
    setupAddQuestError: ({ error }: { error: Error }): void => {
      questAddProxy.setupAddQuestError({ message: error.message });
    },
    setupModifyQuest: ({ result: _result }: { result: ModifyQuestResult }): void => {
      questModifyProxy.setupModifyQuest();
    },
    setupModifyQuestError: ({ error }: { error: Error }): void => {
      questModifyProxy.setupModifyQuestError({ message: error.message });
    },
    setupVerifyQuest: ({ result: _result }: { result: VerifyQuestResult }): void => {
      questVerifyProxy.setupVerifyQuest();
    },
    setupVerifyQuestError: ({ error }: { error: Error }): void => {
      questVerifyProxy.setupVerifyQuestError({ message: error.message });
    },
    setupStartQuest: ({ processId }: { processId: ProcessId }): void => {
      questStartProxy.setupStartQuest({ processId });
    },
    setupStartQuestError: ({ error }: { error: Error }): void => {
      questStartProxy.setupStartQuestError({ message: error.message });
    },
    setupGetQuestStatus: ({ status }: { status: OrchestrationStatus }): void => {
      processStatusProxy.setupGetStatus({ status });
    },
    setupGetQuestStatusError: ({ error }: { error: Error }): void => {
      processStatusProxy.setupGetStatusError({ message: error.message });
    },
    setupJsonlContent: ({ content }: { content: string }): void => {
      chatHistoryProxy.setupMainEntries({ content });
    },
    setupJsonlError: ({ error: _error }: { error: Error }): void => {
      // JSONL errors delegated through session-chat-history responder proxy chain
    },
    setupSubagentReaddir: ({ files: _files }: { files: string[] }): void => {
      chatHistoryProxy.setupSubagentDirMissing();
    },
    setupStartChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      sessionNewProxy.setupSessionNew({ chatProcessId });
      sessionChatProxy.setupSessionChat({ chatProcessId });
    },
    setupStartChatError: ({ error }: { error: Error }): void => {
      sessionNewProxy.setupError({ message: error.message });
      sessionChatProxy.setupError({ message: error.message });
    },
    setupStopChat: ({ stopped }: { stopped: boolean }): void => {
      if (stopped) {
        sessionChatStopProxy.setupWithProcess();
      } else {
        sessionChatStopProxy.setupEmpty();
      }
    },
    getBroadcastedMessages: (): WsMessage[] => broadcastProxy.getCapturedMessages(),
  };
};
