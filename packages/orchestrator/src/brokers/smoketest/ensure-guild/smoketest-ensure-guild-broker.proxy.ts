import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  type FilePath,
  type GuildConfig,
  type GuildIdStub,
  repoRootCwdContract,
  type RepoRootCwd,
} from '@dungeonmaster/shared/contracts';
import {
  cwdResolveBrokerProxy,
  dungeonmasterHomeFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { Dirent } from 'fs';

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
    homeRepoRoot?: RepoRootCwd;
    guildRepoRoots?: readonly (RepoRootCwd | null)[];
  }) => void;
  setupReturnsGuildId: (params: { guildId: GuildId }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  dungeonmasterHomeFindBrokerProxy();
  const listProxy = guildListBrokerProxy();

  // smoketestEnsureGuildBroker resolves repo-root for the dungeonmaster home AND for every guild
  // in the config. Stub cwdResolveBroker directly so passthrough tests don't have to seed a full
  // walk-up chain per guild path. Default: every call returns '/repo-root' so the home and the
  // first guild collapse to the same answer (matched).
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });
  cwdResolveMock.mockResolvedValue(repoRootCwdContract.parse('/repo-root'));

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
      }>({
        module: './smoketest-ensure-guild-broker',
      });
      mocked.mockImplementation(realMod.smoketestEnsureGuildBroker);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
    setupGuildPresent: ({
      config,
      homeDir,
      homePath,
      guildEntries,
      homeRepoRoot,
      guildRepoRoots,
    }: {
      config: GuildConfig;
      homeDir: string;
      homePath: FilePath;
      guildEntries: readonly {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
      homeRepoRoot?: RepoRootCwd;
      guildRepoRoots?: readonly (RepoRootCwd | null)[];
    }): void => {
      listProxy.setupGuildList({
        config,
        homeDir,
        homePath,
        guildEntries: guildEntries.slice(),
      });

      // Default scenario: home and every guild resolve to '/repo-root', so the first guild matches.
      // Tests that need a different layout pass `homeRepoRoot` + per-guild `guildRepoRoots` (null
      // entries simulate cwdResolveBroker rejecting for that guild).
      const homeAnchor = homeRepoRoot ?? repoRootCwdContract.parse('/repo-root');
      const perGuild =
        guildRepoRoots ??
        (config.guilds.map(() =>
          repoRootCwdContract.parse('/repo-root'),
        ) as readonly RepoRootCwd[]);

      cwdResolveMock.mockClear();
      cwdResolveMock.mockResolvedValueOnce(homeAnchor);
      for (const root of perGuild) {
        if (root === null) {
          cwdResolveMock.mockRejectedValueOnce(new Error('repo-root not found'));
        } else {
          cwdResolveMock.mockResolvedValueOnce(root);
        }
      }
    },
  };
};
