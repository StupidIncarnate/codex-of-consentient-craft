import type { ExitCodeStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { GuildConfigStub, GuildStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { readlineCreateInterfaceAdapterProxy } from '../../../adapters/readline/create-interface/readline-create-interface-adapter.proxy';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { designSessionWriteLayerBrokerProxy } from './design-session-write-layer-broker.proxy';

type ExitCode = ReturnType<typeof ExitCodeStub>;
type Quest = ReturnType<typeof QuestStub>;

export const designChatSpawnBrokerProxy = (): {
  setupDesignSession: (params: {
    exitCode: ExitCode;
    quest: Quest;
    stdoutLines?: readonly string[];
  }) => void;
  setupQuestNotFound: () => void;
  setupInvalidStatus: (params: { quest: Quest }) => void;
  emitLines: (params: { lines: readonly string[] }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();
  const rlProxy = readlineCreateInterfaceAdapterProxy();
  const questProxy = questGetBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  designSessionWriteLayerBrokerProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  const defaultGuildId = GuildIdStub();
  const defaultGuild = GuildStub({ id: defaultGuildId });
  guildProxy.setupConfig({ config: GuildConfigStub({ guilds: [defaultGuild] }) });

  return {
    setupDesignSession: ({
      exitCode,
      quest,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      quest: Quest;
      stdoutLines?: readonly string[];
    }): void => {
      questProxy.setupQuestFound({ quest });
      spawnProxy.setupSuccess({
        exitCode,
        ...(stdoutLines && { stdoutData: stdoutLines as never }),
      });
    },

    setupQuestNotFound: (): void => {
      questProxy.setupEmptyFolder();
    },

    setupInvalidStatus: ({ quest }: { quest: Quest }): void => {
      questProxy.setupQuestFound({ quest });
    },

    emitLines: ({ lines }: { lines: readonly string[] }): void => {
      rlProxy.emitLines({ lines });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
