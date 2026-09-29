import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwd } from '#gateway/node/process';
import { join } from '#gateway/node/path';
import {
  GuildStub,
  QuestIdStub,
  FilePathStub,
  type AddQuestInput,
  type AddQuestResult,
  type Guild,
  type GuildListItem,
  type GuildName,
  type GuildPath,
  type SessionId,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  registerMock,
  registerModuleMock,
  type MockHandle,
} from '@dungeonmaster/testing/register-mock';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

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
  const listProxy = guildListBrokerProxy();
  // Initializing these proxies registers their companion mocks; we still override the
  // top-level mock per setup case below so this broker resolves through them cleanly.
  // The repo-root walk runs for real over the staged fs; guildAddBroker is module-mocked so its
  // internals never run.
  const cwdResolveProxy = cwdResolveBrokerProxy();
  cwdProxy();
  guildAddBrokerProxy();
  questUserAddBrokerProxy();

  const cwdHandle: MockHandle = registerMock({ fn: cwd });
  const joinHandle: MockHandle = registerMock({ fn: join });
  const listMock: MockHandle = registerMock({ fn: guildListBroker });
  const addGuildMock: MockHandle = registerMock({ fn: guildAddBroker });
  const addQuestMock: MockHandle = registerMock({ fn: questUserAddBroker });

  // Default: ensure we never accidentally pick up the real implementation between tests.
  // guildListBroker takes no arguments at all, so `[]` is the honest address.
  listMock.calledWith([]).resolves([]);

  return {
    setupResolvedRepoRoot: ({
      cwd: currentWorkingDirectory,
      repoRoot,
    }: {
      cwd: string;
      repoRoot: string;
    }): void => {
      cwdHandle.calledWith([]).returns(currentWorkingDirectory);
      if (repoRoot === currentWorkingDirectory) {
        cwdResolveProxy.setupRepoRootFoundAtStart({ startPath: currentWorkingDirectory });
        return;
      }
      cwdResolveProxy.setupRepoRootFoundInParent({
        startPath: currentWorkingDirectory,
        repoRoot,
      });
    },

    setupResolveFallback: ({ cwd: currentWorkingDirectory }: { cwd: string }): void => {
      cwdHandle.calledWith([]).returns(currentWorkingDirectory);
      cwdResolveProxy.setupRepoRootNotFound({ startPath: currentWorkingDirectory });
    },

    // The first config-path join is where the walk begins, so a throw there is the walk failing
    // with something other than ProjectRootNotFoundError.
    setupResolveError: ({
      cwd: currentWorkingDirectory,
      error,
    }: {
      cwd: string;
      error: Error;
    }): void => {
      cwdHandle.calledWith([]).returns(currentWorkingDirectory);
      joinHandle
        .calledWith([currentWorkingDirectory, dungeonmasterHomeStatics.paths.projectConfigFile])
        .throws(error);
    },

    setupGuilds: ({ guilds }: { guilds: readonly GuildListItem[] }): void => {
      listProxy.setupDirectListing({ items: guilds });
    },

    setupAutoCreatedGuild: ({ guild }: { guild: Guild }): void => {
      // guildAddBroker's own address — name + path — is exactly what the broker derives from
      // the resolved repo root, so this keys on the same values the real call will carry.
      addGuildMock
        .calledWith([{ name: guild.name, path: guild.path }])
        .resolves(GuildStub({ ...guild }));
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
      // questUserAddBroker fires exactly once per broker invocation, and each test stages
      // exactly one of setupSuccessfulAdd / setupAddSuccessWithoutQuestId / setupAddFailure —
      // there is never a second call for `[]` to collide with, so it is the honest address.
      addQuestMock.calledWith([]).resolves(addResult);
    },

    setupAddSuccessWithoutQuestId: (): void => {
      const addResult = {
        success: true,
      } as unknown as AddQuestResult;
      addQuestMock.calledWith([]).resolves(addResult);
    },

    setupAddFailure: ({ error }: { error: string }): void => {
      const addResult = {
        success: false,
        error,
      } as unknown as AddQuestResult;
      addQuestMock.calledWith([]).resolves(addResult);
    },

    getGuildAddCalls: (): readonly { name: GuildName; path: GuildPath }[] =>
      addGuildMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof guildAddBroker>[0]];
        return { name: params.name, path: params.path };
      }),

    // No caller-known address exists (sessionId/questType vary per test) — `.map()` walks the
    // COMPLETE call history into extracted {questType, sessionId} pairs first, so the tail read
    // picks a value already computed from every recorded call, not a raw unaddressed peek.
    getLastQuestAddCall: (): {
      questType: AddQuestInput['questType'];
      sessionId: SessionId | undefined;
    } => {
      const calls = addQuestMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questUserAddBroker>[0]];
        return { questType: params.input.questType, sessionId: params.sessionId };
      });
      const lastCall = calls.at(-1);
      if (lastCall === undefined) {
        throw new Error('questUserAddBroker was not called');
      }
      return lastCall;
    },
  };
};
