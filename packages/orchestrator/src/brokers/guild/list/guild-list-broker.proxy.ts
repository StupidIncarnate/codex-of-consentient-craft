import {
  dungeonmasterHomeFindBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  absoluteFilePathContract,
  type FilePath,
  type GuildConfig,
  type GuildListItem,
} from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

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

  // guildListBroker takes no arguments at all — [] is the honest address, not a shortcut.
  const mock = registerMock({ fn: guildListBroker });
  // Default: passthrough so existing consumers driving the fs chain keep working.
  const realMod = requireActual<{ guildListBroker: typeof guildListBroker }>({
    module: './guild-list-broker',
  });
  mock.calledWith([]).implement(realMod.guildListBroker as never);

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
      // Staged in the SAME ORDER the real broker makes these calls: read, THEN this broker's
      // own dungeonmasterHomeFindBroker() call for `homePath`, THEN — only when backfilling a
      // missing urlSlug — the write. pathJoinAdapterProxy answers calls from a single shared
      // FIFO queue regardless of which broker is asking, so staging out of the real call order
      // (or staging the write unconditionally when the real flow never calls it) hands a LATER
      // join call an EARLIER entry's value instead of its own.
      homeFindProxy.setupHomePath({ homeDir, homePath });
      if (config.guilds.some((guild) => !guild.urlSlug)) {
        configWriteProxy.setupSuccess();
      }

      for (const entry of guildEntries) {
        accessibleProxy.setupResult({ result: entry.accessible });
        pathJoinProxy.returns({ result: entry.questsDirPath });
        readdirProxy.returns({
          dirPath: absoluteFilePathContract.parse(String(entry.questsDirPath)),
          entries: entry.questDirEntries,
        });
      }
    },

    setupEmptyConfig: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      configReadProxy.setupConfig({ config: { guilds: [] } });
      homeFindProxy.setupHomePath({ homeDir, homePath });
    },

    setupDirectListing: ({ items }: { items: readonly GuildListItem[] }): void => {
      mock.onceFor([]).resolves(items as GuildListItem[]);
    },
  };
};
