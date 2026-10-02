import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import type { HomeConfig, GuildListItem } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { homeConfigReadBrokerProxy } from '../../home-config/read/home-config-read-broker.proxy';
import { homeConfigWriteBrokerProxy } from '../../home-config/write/home-config-write-broker.proxy';
import { pathIsAccessibleBrokerProxy } from '../../path/is-accessible/path-is-accessible-broker.proxy';
import { guildListBroker } from './guild-list-broker';
import { HomeConfigStub } from '@dungeonmaster/shared/contracts/home-config/home-config.stub';

registerModuleMock({ module: './guild-list-broker' });

export const guildListBrokerProxy = (): {
  setupGuildList: (params: {
    config: HomeConfig;
    homeDir: string;
    homePath: string;
    guildEntries: {
      accessible: boolean;
      questsDirPath: string;
      questDirEntries: DirEntrySync[];
    }[];
  }) => void;
  setupEmptyConfig: (params: { homeDir: string; homePath: string }) => void;
  setupDirectListing: (params: { items: readonly GuildListItem[] }) => void;
} => {
  const configReadProxy = homeConfigReadBrokerProxy();
  const configWriteProxy = homeConfigWriteBrokerProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle: MockHandle = registerMock({ fn: join });
  const readdirProxy = readdirEntriesSyncProxy();
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
      config: HomeConfig;
      homeDir: string;
      homePath: string;
      guildEntries: {
        accessible: boolean;
        questsDirPath: string;
        questDirEntries: DirEntrySync[];
      }[];
    }): void => {
      // homeDir/homePath forwarded to homeConfigReadBrokerProxy's own setupConfig — its exact
      // join()/homedir() addresses must agree with this proxy's OWN setupHomePath below, since
      // both stage the SAME shared gateway mocks; a bare setupConfig({config}) here would stage
      // its address off homeConfigReadBrokerProxy's own DEFAULT home instead of this test's.
      configReadProxy.setupConfig({ config, homeDir, homePath });
      homeFindProxy.setupHomePath({ homeDir, homePath });
      if (config.guilds.some((guild) => !guild.urlSlug)) {
        configWriteProxy.setupSuccess();
      }

      // Zipped by INDEX with config.guilds — one entry per guild, in the same order
      // config.guilds lists them. Each entry's questsDirPath is staged as the exact join()
      // result for THAT guild's own (homePath, guildsDir, guildId, questsDir) tuple, so a swap
      // between two guilds' answers cannot go unnoticed the way an address-less queue would.
      config.guilds.forEach((guild, index) => {
        const entry = guildEntries[index];
        if (entry === undefined) {
          return;
        }
        accessibleProxy.setupResult({ path: guild.path, result: entry.accessible });
        joinHandle
          .calledWith([
            homePath,
            dungeonmasterHomeStatics.paths.guildsDir,
            guild.id,
            dungeonmasterHomeStatics.paths.questsDir,
          ])
          .returns(entry.questsDirPath);
        readdirProxy.returns({
          path: entry.questsDirPath,
          entries: entry.questDirEntries,
        });
      });
    },

    setupEmptyConfig: ({ homeDir, homePath }: { homeDir: string; homePath: string }): void => {
      configReadProxy.setupConfig({ config: HomeConfigStub({ guilds: [] }), homeDir, homePath });
      homeFindProxy.setupHomePath({ homeDir, homePath });
    },

    setupDirectListing: ({ items }: { items: readonly GuildListItem[] }): void => {
      mock.onceFor([]).resolves(items as GuildListItem[]);
    },
  };
};
