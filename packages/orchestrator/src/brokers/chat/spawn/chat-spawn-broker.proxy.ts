import type { ExitCodeStub, QuestStub, RepoRootCwd } from '@dungeonmaster/shared/contracts';
import {
  GuildConfigStub,
  GuildStub,
  GuildIdStub,
  repoRootCwdContract,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { chatStreamProcessHandleBrokerProxy } from '../stream-process-handle/chat-stream-process-handle-broker.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questUserAddBrokerProxy } from '../../quest/user-add/quest-user-add-broker.proxy';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../quest/modify/quest-modify-broker.proxy';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type Quest = ReturnType<typeof QuestStub>;

export const chatSpawnBrokerProxy = (): {
  setupNewSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupResumeSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupQuestCreationFailure: () => void;
  setupGlyphsmithSession: (params: {
    exitCode: ExitCode;
    quest: Quest;
    stdoutLines?: readonly string[];
  }) => void;
  setupQuestNotFound: () => void;
  setupInvalidStatus: (params: { quest: Quest }) => void;
  refreshGuildConfig: () => void;
  setupSessionLinkQuest: (params: { quest: Quest }) => void;
  setupSessionLinkReject: (params: { error: Error }) => void;
  setupStderrCapture: () => SpyOnHandle;
  setupCwdResolveSuccess: (params: { cwd: string }) => void;
  setupCwdResolveReject: (params: { error: Error }) => void;
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  // chatSpawnBroker creates a chatStreamProcessHandleBroker per call; loading its proxy
  // wires up the transitive subagent-tail + claude-line-normalize mocks the handle needs.
  chatStreamProcessHandleBrokerProxy();
  const unifiedProxy = agentSpawnUnifiedBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const addProxy = questUserAddBrokerProxy();

  // chat-spawn-broker walks up from the guild path to the repo root via cwdResolveBroker.
  // Stub it directly so tests don't need to seed fs.access expectations for the walk-up.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });
  cwdResolveMock.mockResolvedValue(repoRootCwdContract.parse('/home/user/my-guild'));

  registerSpyOn({ object: crypto, method: 'randomUUID' }).mockReturnValue(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  );

  const defaultGuildId = GuildIdStub();
  const defaultGuild = GuildStub({ id: defaultGuildId });

  const setupGuild = (): void => {
    guildProxy.setupConfig({ config: GuildConfigStub({ guilds: [defaultGuild] }) });
  };

  setupGuild();

  return {
    setupNewSession: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: readonly string[];
    }): void => {
      // questUserAddBrokerProxy default mock already handles quest creation
      unifiedProxy.setupSpawnAndEmitLines({
        lines: stdoutLines ?? [],
        exitCode,
      });
    },

    setupResumeSession: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: readonly string[];
    }): void => {
      unifiedProxy.setupSpawnAndEmitLines({
        lines: stdoutLines ?? [],
        exitCode,
      });
    },

    setupQuestCreationFailure: (): void => {
      addProxy.setupCreateFailure({
        error: new Error('mkdir failed'),
      });
    },

    setupGlyphsmithSession: ({
      exitCode,
      quest,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      quest: Quest;
      stdoutLines?: readonly string[];
    }): void => {
      getProxy.setupQuestFound({ quest });
      unifiedProxy.setupSpawnAndEmitLines({
        lines: stdoutLines ?? [],
        exitCode,
      });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupInvalidStatus: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    refreshGuildConfig: (): void => {
      setupGuild();
    },

    setupSessionLinkQuest: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    setupSessionLinkReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupStderrCapture: (): SpyOnHandle => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      handle.mockImplementation(() => true);
      return handle;
    },

    setupCwdResolveSuccess: ({ cwd }: { cwd: string }): void => {
      cwdResolveMock.mockResolvedValue(repoRootCwdContract.parse(cwd));
    },

    setupCwdResolveReject: ({ error }: { error: Error }): void => {
      cwdResolveMock.mockImplementation(() => {
        throw error;
      });
    },

    getSpawnedOptions: (): unknown => unifiedProxy.getSpawnedOptions(),

    getSpawnedCwd: (): RepoRootCwd | undefined => unifiedProxy.getSpawnedCwd(),
  };
};
