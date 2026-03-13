import type { ExitCodeStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { GuildConfigStub, GuildStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { designSessionWriteLayerBrokerProxy } from './design-session-write-layer-broker.proxy';
import { questSessionWriteLayerBrokerProxy } from './quest-session-write-layer-broker.proxy';
import { resolveQuestLayerBrokerProxy } from './resolve-quest-layer-broker.proxy';

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
} => {
  const unifiedProxy = agentSpawnUnifiedBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const resolveProxy = resolveQuestLayerBrokerProxy();
  questSessionWriteLayerBrokerProxy();
  designSessionWriteLayerBrokerProxy();

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
      resolveProxy.setupQuestCreation();
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
      resolveProxy.setupQuestCreationFailure();
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
      resolveProxy.setupQuestFound({ quest });
      unifiedProxy.setupSpawnAndEmitLines({
        lines: stdoutLines ?? [],
        exitCode,
      });
    },

    setupQuestNotFound: (): void => {
      resolveProxy.setupQuestNotFound();
    },

    setupInvalidStatus: ({ quest }: { quest: Quest }): void => {
      resolveProxy.setupQuestFound({ quest });
    },

    refreshGuildConfig: (): void => {
      setupGuild();
    },
  };
};
