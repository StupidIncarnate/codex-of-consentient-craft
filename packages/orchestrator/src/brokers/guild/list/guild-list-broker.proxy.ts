import {
  dungeonmasterHomeFindBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath, GuildConfig, GuildListItem } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { guildConfigReadBrokerProxy } from '../../guild-config/read/guild-config-read-broker.proxy';
import { guildConfigWriteBrokerProxy } from '../../guild-config/write/guild-config-write-broker.proxy';
import { pathIsAccessibleBrokerProxy } from '../../path/is-accessible/path-is-accessible-broker.proxy';
import { guildListBroker } from './guild-list-broker';

registerModuleMock({ module: './guild-list-broker' });

export const guildListBrokerProxy = (): {
  setupGuildList: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildEntries: {
      accessible: boolean;
      questsDirPath: FilePath;
      questDirEntries: Dirent[];
    }[];
  }) => void;
  setupEmptyConfig: (params: { homeDir: string; homePath: FilePath }) => void;
  setupDirectListing: (params: { items: readonly GuildListItem[] }) => void;
} => {
  const configReadProxy = guildConfigReadBrokerProxy();
  const configWriteProxy = guildConfigWriteBrokerProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const accessibleProxy = pathIsAccessibleBrokerProxy();

  const mocked = guildListBroker as jest.MockedFunction<typeof guildListBroker>;
  // Default: passthrough so existing consumers driving the fs chain keep working.
  const realMod = requireActual<{ guildListBroker: typeof guildListBroker }>({
    module: './guild-list-broker',
  });
  mocked.mockImplementation(realMod.guildListBroker);

  return {
    setupGuildList: ({
      config,
      homeDir,
      homePath,
      guildEntries,
    }: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      configReadProxy.setupConfig({ config });
      configWriteProxy.setupSuccess();
      homeFindProxy.setupHomePath({ homeDir, homePath });

      for (const entry of guildEntries) {
        accessibleProxy.setupResult({ result: entry.accessible });
        pathJoinProxy.returns({ result: entry.questsDirPath });
        readdirProxy.returns({ entries: entry.questDirEntries });
      }
    },

    setupEmptyConfig: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      configReadProxy.setupConfig({ config: { guilds: [] } });
      homeFindProxy.setupHomePath({ homeDir, homePath });
    },

    setupDirectListing: ({ items }: { items: readonly GuildListItem[] }): void => {
      mocked.mockResolvedValueOnce(items as GuildListItem[]);
    },
  };
};
