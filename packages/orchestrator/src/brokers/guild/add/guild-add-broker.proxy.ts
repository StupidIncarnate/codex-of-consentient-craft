import {
  dungeonmasterHomeEnsureBrokerProxy,
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath, GuildConfig } from '@dungeonmaster/shared/contracts';

import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';
import { guildConfigWriteBrokerProxy } from '../../guild-config/write/guild-config-write-broker.proxy';

export const guildAddBrokerProxy = (): {
  setupAddGuild: (params: {
    existingConfig: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildsPath: FilePath;
    guildDirPath: FilePath;
    questsDirPath: FilePath;
  }) => void;
  setupDuplicatePath: (params: { existingConfig: GuildConfig }) => void;
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const configWriteProxy = guildConfigWriteBrokerProxy();
  const homeEnsureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupAddGuild: ({
      existingConfig,
      homeDir,
      homePath,
      guildsPath,
      guildDirPath,
      questsDirPath,
    }: {
      existingConfig: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildsPath: FilePath;
      guildDirPath: FilePath;
      questsDirPath: FilePath;
    }): void => {
      configReadProxy.setupConfig({ config: existingConfig });
      homeEnsureProxy.setupEnsureSuccess({ homeDir, homePath, guildsPath });
      pathJoinProxy.returns({ result: guildDirPath });
      pathJoinProxy.returns({ result: questsDirPath });
      mkdirProxy.succeeds({ filepath: questsDirPath });
      configWriteProxy.setupSuccess();
    },

    setupDuplicatePath: ({ existingConfig }: { existingConfig: GuildConfig }): void => {
      configReadProxy.setupConfig({ config: existingConfig });
    },
  };
};
