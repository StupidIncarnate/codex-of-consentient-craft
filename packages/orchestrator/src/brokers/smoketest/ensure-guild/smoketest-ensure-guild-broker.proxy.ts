import { dungeonmasterHomeEnsureBrokerProxy } from '@dungeonmaster/shared/testing';
import type {
  FilePath,
  GuildConfig,
  GuildIdStub,
  GuildListItem,
} from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { Dirent } from 'fs';

import { guildAddBrokerProxy } from '../../guild/add/guild-add-broker.proxy';
import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { smoketestEnsureGuildBroker } from './smoketest-ensure-guild-broker';

registerModuleMock({ module: './smoketest-ensure-guild-broker' });

type GuildId = ReturnType<typeof GuildIdStub>;

export const smoketestEnsureGuildBrokerProxy = (): {
  setupGuildPresent: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: FilePath;
    guildEntries: readonly {
      accessible: boolean;
      questsDirPath: FilePath;
      questDirEntries: Dirent[];
    }[];
  }) => void;
  findMatchingGuildByName: (params: {
    guilds: readonly GuildListItem[];
    name: string;
  }) => GuildListItem | undefined;
  setupReturnsGuildId: (params: { guildId: GuildId }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
} => {
  dungeonmasterHomeEnsureBrokerProxy();
  const listProxy = guildListBrokerProxy();
  guildAddBrokerProxy();

  const mocked = smoketestEnsureGuildBroker as jest.MockedFunction<
    typeof smoketestEnsureGuildBroker
  >;

  return {
    setupReturnsGuildId: ({ guildId }: { guildId: GuildId }): void => {
      mocked.mockResolvedValueOnce({ guildId });
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        smoketestEnsureGuildBroker: typeof smoketestEnsureGuildBroker;
      }>({ module: './smoketest-ensure-guild-broker' });
      mocked.mockImplementation(realMod.smoketestEnsureGuildBroker);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
    setupGuildPresent: ({
      config,
      homeDir,
      homePath,
      guildEntries,
    }: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: readonly {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      listProxy.setupGuildList({
        config,
        homeDir,
        homePath,
        guildEntries: guildEntries.slice(),
      });
    },
    findMatchingGuildByName: ({
      guilds,
      name,
    }: {
      guilds: readonly GuildListItem[];
      name: string;
    }): GuildListItem | undefined => guilds.find((guild) => guild.name === name),
  };
};
