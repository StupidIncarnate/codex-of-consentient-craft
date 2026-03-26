import type { ExitCodeStub, QuestStub } from '@dungeonmaster/shared/contracts';
import {
  FilePathStub,
  GuildConfigStub,
  GuildStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questAddBrokerProxy } from '../../quest/add/quest-add-broker.proxy';
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
  setupStderrCapture: () => jest.SpyInstance;
} => {
  const unifiedProxy = agentSpawnUnifiedBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const addProxy = questAddBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

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
      // questAddBrokerProxy default mock already handles quest creation
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
      const questsFolderPath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds/quests',
      });
      addProxy.setupQuestCreationFailure({
        questsFolderPath,
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

    setupStderrCapture: (): jest.SpyInstance =>
      jest.spyOn(process.stderr, 'write').mockImplementation(() => true),
  };
};
