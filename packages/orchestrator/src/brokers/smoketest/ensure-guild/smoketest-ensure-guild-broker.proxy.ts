import type { GuildConfig } from '@dungeonmaster/shared/contracts';
import type { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { DirEntrySync } from '#gateway/node/fs';

import { guildListBrokerProxy } from '../../guild/list/guild-list-broker.proxy';
import { smoketestEnsureGuildBroker } from './smoketest-ensure-guild-broker';

registerModuleMock({ module: './smoketest-ensure-guild-broker' });

type GuildId = ReturnType<typeof GuildIdStub>;

export const smoketestEnsureGuildBrokerProxy = (): {
  setupGuildPresent: (params: {
    config: GuildConfig;
    homeDir: string;
    homePath: string;
    guildEntries: readonly {
      accessible: boolean;
      questsDirPath: string;
      questDirEntries: DirEntrySync[];
    }[];
    homeRepoRoot?: string;
    guildRepoRoots?: readonly (string | null)[];
  }) => void;
  setupReturnsGuildId: (params: { guildId: GuildId }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => RecordedCalls;
} => {
  const cwdProxy = cwdResolveBrokerProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const listProxy = guildListBrokerProxy();

  // smoketestEnsureGuildBroker walks up to the repo root for the dungeonmaster home AND for every
  // guild in the config. Each walk runs for real over the staged filesystem, addressed by its own
  // start path, so passthrough tests don't have to worry about call order.
  const stageRepoRoot = ({
    startPath,
    repoRoot,
  }: {
    startPath: string;
    repoRoot: string | null;
  }): void => {
    if (repoRoot === null) {
      cwdProxy.setupRepoRootNotFound({ startPath });
      return;
    }
    if (repoRoot === startPath) {
      cwdProxy.setupRepoRootFoundAtStart({ startPath });
      return;
    }
    cwdProxy.setupRepoRootFoundInParent({ startPath, repoRoot });
  };

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
      homePath: string;
      guildEntries: readonly {
        accessible: boolean;
        questsDirPath: string;
        questDirEntries: DirEntrySync[];
      }[];
      homeRepoRoot?: string;
      guildRepoRoots?: readonly (string | null)[];
    }): void => {
      // dungeonmasterHomeFindBroker() is called an extra, EARLIER time here — directly by this
      // broker itself — on top of the calls guildConfigReadBroker and guildListBroker each make
      // internally once guildListBroker() runs below. This stage and guildListBroker's own
      // internal restage of the identical {homeDir, homePath} pair both address the SAME exact
      // `join`/`homedir` tuples, so the second registration simply re-affirms the first rather
      // than colliding with it. homePath is the start path of the home walk-up staged below.
      homeFindProxy.setupHomePath({ homeDir, homePath });

      listProxy.setupGuildList({
        config,
        homeDir,
        homePath,
        guildEntries: guildEntries.slice(),
      });

      // Default scenario: home and every guild resolve to '/', the one root every start path sits under, so the first guild
      // matches. Tests that need a different layout pass `homeRepoRoot` + per-guild
      // `guildRepoRoots` (null entries simulate the walk finding no `.dungeonmaster.json` for that
      // guild). A repo root is an ancestor-or-self of the start path it answers for.
      const homeAnchor = homeRepoRoot ?? '/';
      const perGuild = guildRepoRoots ?? (config.guilds.map(() => '/') as readonly string[]);

      stageRepoRoot({ startPath: homePath, repoRoot: homeAnchor });

      config.guilds.forEach((guild, index) => {
        stageRepoRoot({ startPath: String(guild.path), repoRoot: perGuild[index] ?? null });
      });
    },
  };
};
