import { glob as _glob } from 'glob';
import { readFile as _readFile } from 'fs/promises';
import { existsSync as _existsSync } from 'fs';
import { join as _join } from 'path';
import { spawn as _spawn } from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import type { ChildProcess } from 'child_process';

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
  },
}));
jest.mock('glob', () => ({
  glob: jest.fn().mockResolvedValue([]),
}));
jest.mock('fs/promises');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));
jest.mock('path', () => jest.requireActual('path'));
jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  spawn: jest.fn(),
}));

import {
  architectureOverviewBrokerProxy,
  osHomedirAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { architectureFolderDetailBrokerProxy } from '../brokers/architecture/folder-detail/architecture-folder-detail-broker.proxy';
import { architectureSyntaxRulesBrokerProxy } from '../brokers/architecture/syntax-rules/architecture-syntax-rules-broker.proxy';
import { architectureTestingPatternsBrokerProxy } from '../brokers/architecture/testing-patterns/architecture-testing-patterns-broker.proxy';
import { mcpDiscoverBrokerProxy } from '../brokers/mcp/discover/mcp-discover-broker.proxy';
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
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListGuildsAdapterProxy } from '../adapters/orchestrator/list-guilds/orchestrator-list-guilds-adapter.proxy';
import { orchestratorAddGuildAdapterProxy } from '../adapters/orchestrator/add-guild/orchestrator-add-guild-adapter.proxy';
import { orchestratorGetGuildAdapterProxy } from '../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter.proxy';
import { orchestratorUpdateGuildAdapterProxy } from '../adapters/orchestrator/update-guild/orchestrator-update-guild-adapter.proxy';
import { orchestratorRemoveGuildAdapterProxy } from '../adapters/orchestrator/remove-guild/orchestrator-remove-guild-adapter.proxy';
import { orchestratorBrowseDirectoriesAdapterProxy } from '../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter.proxy';
import { orchestratorListQuestsAdapterProxy } from '../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter.proxy';
import { orchestratorGetQuestAdapterProxy } from '../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.proxy';
import { orchestratorAddQuestAdapterProxy } from '../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { orchestratorVerifyQuestAdapterProxy } from '../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter.proxy';
import { orchestratorStartQuestAdapterProxy } from '../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter.proxy';
import { orchestratorGetQuestStatusAdapterProxy } from '../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter.proxy';
import { honoServeAdapterProxy } from '../adapters/hono/serve/hono-serve-adapter.proxy';
import { honoCreateNodeWebSocketAdapterProxy } from '../adapters/hono/create-node-web-socket/hono-create-node-web-socket-adapter.proxy';
import { agentOutputBufferStateProxy } from '../state/agent-output-buffer/agent-output-buffer-state.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { fsReadJsonlAdapterProxy } from '../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';
import { processDevLogAdapterProxy } from '../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { chatProcessStateProxy } from '../state/chat-process/chat-process-state.proxy';
import { questSessionPersistBrokerProxy } from '../brokers/quest-session/persist/quest-session-persist-broker.proxy';
import { guildSessionPersistBrokerProxy } from '../brokers/guild-session/persist/guild-session-persist-broker.proxy';
import { sessionResolveOwnerBrokerProxy } from '../brokers/session/resolve-owner/session-resolve-owner-broker.proxy';
import { globFindAdapterProxy } from '../adapters/glob/find/glob-find-adapter.proxy';
import { sessionSummaryCacheStateProxy } from '../state/session-summary-cache/session-summary-cache-state.proxy';
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
  setupChatSpawn: () => {
    emitLine: (line: string) => void;
    emitExit: (code: number) => void;
  };
  getBroadcastedMessages: () => WsMessage[];
} => {
  const serveProxy = honoServeAdapterProxy();
  const wsProxy = honoCreateNodeWebSocketAdapterProxy();
  architectureOverviewBrokerProxy();
  architectureFolderDetailBrokerProxy();
  architectureSyntaxRulesBrokerProxy();
  architectureTestingPatternsBrokerProxy();
  mcpDiscoverBrokerProxy();
  agentOutputBufferStateProxy();
  chatProcessStateProxy();
  const broadcastProxy = wsEventRelayBroadcastBrokerProxy();
  const jsonlProxy = fsReadJsonlAdapterProxy();
  processDevLogAdapterProxy();
  questSessionPersistBrokerProxy();
  guildSessionPersistBrokerProxy();
  sessionResolveOwnerBrokerProxy();
  globFindAdapterProxy();
  sessionSummaryCacheStateProxy();
  osHomedirAdapterProxy();

  const listGuildsProxy = orchestratorListGuildsAdapterProxy();
  const addGuildProxy = orchestratorAddGuildAdapterProxy();
  const getGuildProxy = orchestratorGetGuildAdapterProxy();
  const updateGuildProxy = orchestratorUpdateGuildAdapterProxy();
  const removeGuildProxy = orchestratorRemoveGuildAdapterProxy();
  const browseDirectoriesProxy = orchestratorBrowseDirectoriesAdapterProxy();
  const listQuestsProxy = orchestratorListQuestsAdapterProxy();
  const getQuestProxy = orchestratorGetQuestAdapterProxy();
  const addQuestProxy = orchestratorAddQuestAdapterProxy();
  const modifyQuestProxy = orchestratorModifyQuestAdapterProxy();
  const verifyQuestProxy = orchestratorVerifyQuestAdapterProxy();
  const startQuestProxy = orchestratorStartQuestAdapterProxy();
  const getQuestStatusProxy = orchestratorGetQuestStatusAdapterProxy();

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
      listGuildsProxy.returns({ guilds });
    },
    setupListGuildsError: ({ error }: { error: Error }): void => {
      listGuildsProxy.throws({ error });
    },
    setupAddGuild: ({ guild }: { guild: Guild }): void => {
      addGuildProxy.returns({ guild });
    },
    setupAddGuildError: ({ error }: { error: Error }): void => {
      addGuildProxy.throws({ error });
    },
    setupGetGuild: ({ guild }: { guild: Guild }): void => {
      getGuildProxy.returns({ guild });
    },
    setupGetGuildError: ({ error }: { error: Error }): void => {
      getGuildProxy.throws({ error });
    },
    setupUpdateGuild: ({ guild }: { guild: Guild }): void => {
      updateGuildProxy.returns({ guild });
    },
    setupUpdateGuildError: ({ error }: { error: Error }): void => {
      updateGuildProxy.throws({ error });
    },
    setupRemoveGuildError: ({ error }: { error: Error }): void => {
      removeGuildProxy.throws({ error });
    },
    setupBrowseDirectories: ({ entries }: { entries: DirectoryEntry[] }): void => {
      browseDirectoriesProxy.returns({ entries });
    },
    setupBrowseDirectoriesError: ({ error }: { error: Error }): void => {
      browseDirectoriesProxy.throws({ error });
    },
    setupListQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      listQuestsProxy.returns({ quests });
    },
    setupListQuestsError: ({ error }: { error: Error }): void => {
      listQuestsProxy.throws({ error });
    },
    setupGetQuest: ({ result }: { result: GetQuestResult }): void => {
      getQuestProxy.returns({ result });
    },
    setupGetQuestError: ({ error }: { error: Error }): void => {
      getQuestProxy.throws({ error });
    },
    setupAddQuest: ({ result }: { result: AddQuestResult }): void => {
      addQuestProxy.returns({ result });
    },
    setupAddQuestError: ({ error }: { error: Error }): void => {
      addQuestProxy.throws({ error });
    },
    setupModifyQuest: ({ result }: { result: ModifyQuestResult }): void => {
      modifyQuestProxy.returns({ result });
    },
    setupModifyQuestError: ({ error }: { error: Error }): void => {
      modifyQuestProxy.throws({ error });
    },
    setupVerifyQuest: ({ result }: { result: VerifyQuestResult }): void => {
      verifyQuestProxy.returns({ result });
    },
    setupVerifyQuestError: ({ error }: { error: Error }): void => {
      verifyQuestProxy.throws({ error });
    },
    setupStartQuest: ({ processId }: { processId: ProcessId }): void => {
      startQuestProxy.returns({ processId });
    },
    setupStartQuestError: ({ error }: { error: Error }): void => {
      startQuestProxy.throws({ error });
    },
    setupGetQuestStatus: ({ status }: { status: OrchestrationStatus }): void => {
      getQuestStatusProxy.returns({ status });
    },
    setupGetQuestStatusError: ({ error }: { error: Error }): void => {
      getQuestStatusProxy.throws({ error });
    },
    setupJsonlContent: ({ content }: { content: string }): void => {
      jsonlProxy.returns({
        filePath: AbsoluteFilePathStub({ value: '/stub/path.jsonl' }),
        content,
      });
    },
    setupJsonlError: ({ error }: { error: Error }): void => {
      jsonlProxy.throws({
        filePath: AbsoluteFilePathStub({ value: '/stub/path.jsonl' }),
        error,
      });
    },
    setupSubagentReaddir: ({ files }: { files: string[] }): void => {
      jsonlProxy.setupReaddir({ files });
    },
    setupChatSpawn: (): {
      emitLine: (line: string) => void;
      emitExit: (code: number) => void;
    } => {
      const stdout = new PassThrough();
      const fakeProcess = Object.assign(new EventEmitter(), {
        stdout,
        stderr: null,
        stdin: null,
        kill: jest.fn(),
        pid: 12345,
      });
      jest.mocked(_spawn).mockReturnValueOnce(fakeProcess as unknown as ChildProcess);
      return {
        emitLine: (line: string): void => {
          stdout.write(`${line}\n`);
        },
        emitExit: (code: number): void => {
          fakeProcess.emit('exit', code);
        },
      };
    },
    getBroadcastedMessages: (): WsMessage[] => broadcastProxy.getCapturedMessages(),
  };
};
