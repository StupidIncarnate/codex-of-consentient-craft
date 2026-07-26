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
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
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
  getCallArgs: () => RecordedCalls;
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const listProxy = guildListBrokerProxy();

  // smoketestEnsureGuildBroker resolves repo-root for the dungeonmaster home AND for every guild
  // in the config. Stub cwdResolveBroker directly, keyed on the real { startPath, kind } each
  // call carries, so passthrough tests don't have to worry about call order — the home walk-up
  // and every per-guild walk-up address their own answer independently.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });

  const mocked = registerMock({ fn: smoketestEnsureGuildBroker });

  return {
    setupReturnsGuildId: ({ guildId }: { guildId: GuildId }): void => {
      mocked.onceFor([]).resolves({ guildId });
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        smoketestEnsureGuildBroker: typeof smoketestEnsureGuildBroker;
      }>({
        module: './smoketest-ensure-guild-broker',
      });
      mocked.calledWith([]).implement(realMod.smoketestEnsureGuildBroker);
    },
    getCallArgs: (): RecordedCalls => mocked.callsMatching([]),
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
      // dungeonmasterHomeFindBroker() is called an extra, EARLIER time here — directly by this
      // broker itself — on top of the calls guildConfigReadBroker and guildListBroker each make
      // internally once guildListBroker() runs below. pathJoinAdapter's mock answers from a
      // single shared FIFO queue keyed only on `kind: []` (not on the real segments), so this
      // stage exists purely to consume ONE MORE queue slot ahead of guildListBroker's own
      // staging — the actual homePath value returned here is never observed: it only feeds
      // cwdResolveBroker's startPath for the home walk-up, which is addressed by `kind` alone
      // (see the comment below), and dungeonmasterHomeFindBroker's other real caller in this
      // chain (guildConfigReadBroker) never inspects it either.
      homeFindProxy.setupHomePath({ homeDir, homePath });

      listProxy.setupGuildList({
        config,
        homeDir,
        homePath,
        guildEntries: guildEntries.slice(),
      });

      // Default scenario: home and every guild resolve to '/repo-root', so the first guild
      // matches. Tests that need a different layout pass `homeRepoRoot` + per-guild
      // `guildRepoRoots` (null entries simulate cwdResolveBroker rejecting for that guild).
      const homeAnchor = homeRepoRoot ?? repoRootCwdContract.parse('/repo-root');
      const perGuild =
        guildRepoRoots ??
        (config.guilds.map(() =>
          repoRootCwdContract.parse('/repo-root'),
        ) as readonly RepoRootCwd[]);

      // cwdResolveBroker's own call order (home first, then each guild in config order —
      // nothing else in this broker's run touches cwdResolveBroker) is what the home answer
      // is staged against: the first `kind: 'repo-root'` call.
      cwdResolveMock.onceFor([{ kind: 'repo-root' }]).resolves(homeAnchor);

      // Each guild's own startPath is guild.path itself, passed straight through from config
      // by guildListBroker with no pathJoin/homedir involvement — unlike the home case, this
      // value IS reliable, so guild calls stay addressed by their real argument.
      config.guilds.forEach((guild, index) => {
        const root = perGuild[index] ?? null;
        const address = [{ startPath: guild.path, kind: 'repo-root' }];
        if (root === null) {
          cwdResolveMock.calledWith(address).rejects(new Error('repo-root not found'));
        } else {
          cwdResolveMock.calledWith(address).resolves(root);
        }
      });
    },
  };
};
