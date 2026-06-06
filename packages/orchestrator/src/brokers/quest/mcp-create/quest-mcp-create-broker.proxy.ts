import {
  GuildStub,
  QuestIdStub,
  RepoRootCwdStub,
  FilePathStub,
  type AddQuestInput,
  type AddQuestResult,
  type Guild,
  type GuildListItem,
  type GuildName,
  type GuildPath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  cwdResolveBrokerProxy,
  pathBasenameAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  registerMock,
  registerModuleMock,
  type MockHandle,
} from '@dungeonmaster/testing/register-mock';
import { ProjectRootNotFoundError } from '@dungeonmaster/shared/errors';

import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { guildAddBrokerProxy } from '../../guild/add/guild-add-broker.proxy';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { questUserAddBroker } from '../user-add/quest-user-add-broker';
import { questUserAddBrokerProxy } from '../user-add/quest-user-add-broker.proxy';

registerModuleMock({ module: '../user-add/quest-user-add-broker' });
registerModuleMock({ module: '../../guild/add/guild-add-broker' });

type QuestId = ReturnType<typeof QuestIdStub>;

export const questMcpCreateBrokerProxy = (): {
  setupResolvedRepoRoot: (params: { cwd: string; repoRoot: string }) => void;
  setupResolveFallback: (params: { cwd: string }) => void;
  setupResolveError: (params: { cwd: string; error: Error }) => void;
  setupGuilds: (params: { guilds: readonly GuildListItem[] }) => void;
  setupAutoCreatedGuild: (params: { guild: Guild }) => void;
  setupSuccessfulAdd: (params: { questId?: QuestId }) => void;
  setupAddSuccessWithoutQuestId: () => void;
  setupAddFailure: (params: { error: string }) => void;
  getGuildAddCalls: () => readonly { name: GuildName; path: GuildPath }[];
  getLastQuestAddCall: () => {
    questType: AddQuestInput['questType'];
    sessionId: SessionId | undefined;
  };
} => {
  const cwdProxy = processCwdAdapterProxy();
  const listProxy = guildListBrokerProxy();
  // Initializing these proxies registers their companion mocks; we still override the
  // top-level mock per setup case below so this broker resolves through them cleanly.
  // cwdResolveBroker is overridden via registerMock so its underlying fs/path mocks
  // aren't actually exercised; guildAddBroker is module-mocked so its internals never run.
  cwdResolveBrokerProxy();
  pathBasenameAdapterProxy();
  guildAddBrokerProxy();
  questUserAddBrokerProxy();

  const resolveMock: MockHandle = registerMock({ fn: cwdResolveBroker });
  const listMock = guildListBroker as jest.MockedFunction<typeof guildListBroker>;
  const addGuildMock = guildAddBroker as jest.MockedFunction<typeof guildAddBroker>;
  const addQuestMock = questUserAddBroker as jest.MockedFunction<typeof questUserAddBroker>;

  // Defaults: ensure we never accidentally pick up the real implementations between tests.
  listMock.mockResolvedValue([]);

  return {
    setupResolvedRepoRoot: ({ cwd, repoRoot }: { cwd: string; repoRoot: string }): void => {
      cwdProxy.returns({ path: cwd });
      resolveMock.mockResolvedValueOnce(RepoRootCwdStub({ value: repoRoot }));
    },

    setupResolveFallback: ({ cwd }: { cwd: string }): void => {
      cwdProxy.returns({ path: cwd });
      resolveMock.mockRejectedValueOnce(new ProjectRootNotFoundError({ startPath: cwd }));
    },

    setupResolveError: ({ cwd, error }: { cwd: string; error: Error }): void => {
      cwdProxy.returns({ path: cwd });
      resolveMock.mockRejectedValueOnce(error);
    },

    setupGuilds: ({ guilds }: { guilds: readonly GuildListItem[] }): void => {
      listProxy.setupDirectListing({ items: guilds });
    },

    setupAutoCreatedGuild: ({ guild }: { guild: Guild }): void => {
      addGuildMock.mockResolvedValueOnce(GuildStub({ ...guild }));
    },

    setupSuccessfulAdd: ({
      questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    }: {
      questId?: QuestId;
    }): void => {
      const addResult = {
        success: true,
        questId,
        questFolder: questId,
        filePath: FilePathStub({ value: '/tmp/quest.json' }),
        chaoswhispererWorkItemId: questId,
      } as unknown as AddQuestResult;
      addQuestMock.mockResolvedValueOnce(addResult);
    },

    setupAddSuccessWithoutQuestId: (): void => {
      const addResult = {
        success: true,
      } as unknown as AddQuestResult;
      addQuestMock.mockResolvedValueOnce(addResult);
    },

    setupAddFailure: ({ error }: { error: string }): void => {
      const addResult = {
        success: false,
        error,
      } as unknown as AddQuestResult;
      addQuestMock.mockResolvedValueOnce(addResult);
    },

    getGuildAddCalls: (): readonly { name: GuildName; path: GuildPath }[] =>
      addGuildMock.mock.calls.map((call) => {
        const [{ name, path }] = call;
        return { name, path };
      }),

    getLastQuestAddCall: (): {
      questType: AddQuestInput['questType'];
      sessionId: SessionId | undefined;
    } => {
      const { calls } = addQuestMock.mock;
      const lastCall = calls[calls.length - 1];
      if (lastCall === undefined) {
        throw new Error('questUserAddBroker was not called');
      }
      const [{ input, sessionId }] = lastCall;
      return { questType: input.questType, sessionId };
    },
  };
};
