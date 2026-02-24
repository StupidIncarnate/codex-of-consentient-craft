import type { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { GuildConfigStub, GuildStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { readlineCreateInterfaceAdapterProxy } from '../../../adapters/readline/create-interface/readline-create-interface-adapter.proxy';
import { questAddBrokerProxy } from '../../quest/add/quest-add-broker.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questSessionWriteLayerBrokerProxy } from './quest-session-write-layer-broker.proxy';

type ExitCode = ReturnType<typeof ExitCodeStub>;

export const chatSpawnBrokerProxy = (): {
  setupNewSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  setupResumeSession: (params: { exitCode: ExitCode; stdoutLines?: readonly string[] }) => void;
  emitLines: (params: { lines: readonly string[] }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();
  const rlProxy = readlineCreateInterfaceAdapterProxy();
  questAddBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  questSessionWriteLayerBrokerProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  const defaultGuildId = GuildIdStub();
  const defaultGuild = GuildStub({ id: defaultGuildId });
  guildProxy.setupConfig({ config: GuildConfigStub({ guilds: [defaultGuild] }) });

  return {
    setupNewSession: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: readonly string[];
    }): void => {
      spawnProxy.setupSuccess({
        exitCode,
        ...(stdoutLines && { stdoutData: stdoutLines as never }),
      });
    },

    setupResumeSession: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: readonly string[];
    }): void => {
      spawnProxy.setupSuccess({
        exitCode,
        ...(stdoutLines && { stdoutData: stdoutLines as never }),
      });
    },

    emitLines: ({ lines }: { lines: readonly string[] }): void => {
      rlProxy.emitLines({ lines });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
