/**
 * PURPOSE: Manages environment variable isolation for orchestration integration tests
 *
 * USAGE:
 * const envHarness = orchestrationEnvironmentHarness();
 * const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness });
 * await envHarness.withRestore(env, async () => { ... });
 */
import * as fs from 'fs';
import * as path from 'path';

import { GuildNameStub, guildPathContract } from '@dungeonmaster/shared/contracts';
import type {
  FilePath,
  GuildId,
  GuildName,
  GuildPath,
  QuestId,
  UrlSlug,
} from '@dungeonmaster/shared/contracts';

import { guildAddBroker } from '../../../src/brokers/guild/add/guild-add-broker';
import { OrchestrationFlow } from '../../../src/flows/orchestration/orchestration-flow';

interface QueueHarness {
  initDirs: (params: { baseDir: GuildPath }) => {
    claudeQueueDir: FilePath;
    wardQueueDir: FilePath;
  };
  resetCounters: () => void;
}

const FAKE_CLAUDE_CLI = path.resolve(
  __dirname,
  '../../../../testing/test/harnesses/claude-mock/bin/claude',
);
const FAKE_WARD_BIN_DIR = path.resolve(__dirname, '../../../test-fixtures/fake-ward-bin');
const FAKE_WARD_CLI = path.join(FAKE_WARD_BIN_DIR, 'dungeonmaster-ward');

const GUILD_CONFIG_FILENAME = 'config.json';
const USAGE_LEDGER_FILENAME = 'usage-ledger.json';

// Both files a dungeonmaster home needs before anything reads it. The ledger stamped NOW is what
// makes usageLedgerScanBroker take its throttle path — a fresh directory has none, the default one
// is stamped at the epoch, and every guardrail pass then reads that as a measurement due and walks
// the developer's own ~/.claude/projects. `packages/testing/src/jest.setup-home.js` carries the
// full reasoning and seeds the same pair into the process-wide sandbox home.
const seedHomeFiles = ({ homeDir }: { homeDir: GuildPath }): void => {
  fs.mkdirSync(homeDir, { recursive: true });
  fs.writeFileSync(path.join(homeDir, GUILD_CONFIG_FILENAME), JSON.stringify({ guilds: [] }));
  fs.writeFileSync(
    path.join(homeDir, USAGE_LEDGER_FILENAME),
    JSON.stringify({
      buckets: {},
      cursors: {},
      ceilings: { fiveHour: null, sevenDay: null },
      updatedAt: new Date().toISOString(),
    }),
  );
};

export const orchestrationEnvironmentHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  setupHome: (params: { tempDir: GuildPath }) => {
    restore: () => void;
  };
  seedHome: (params: { tempDir: GuildPath }) => Promise<void>;
  writeRepoRootMarker: (params: { repoRoot: GuildPath }) => Promise<void>;
  seedQuestRepoPackages: (params: {
    repoRoot: GuildPath;
    locations: readonly string[];
    sources?: readonly string[];
  }) => Promise<void>;
  chdirInto: (params: { dir: GuildPath }) => { restore: () => void };
  makeAndChdir: (params: { dir: GuildPath }) => { restore: () => void };
  readConfigGuilds: (params: {
    tempDir: GuildPath;
  }) => readonly { name: GuildName; path: GuildPath; guildId: GuildId; urlSlug: UrlSlug }[];
  questsDirExists: (params: { tempDir: GuildPath; guildId: GuildId }) => boolean;
  questFilePersisted: (params: { tempDir: GuildPath; guildId: GuildId; questId: QuestId }) => {
    exists: boolean;
    questIdInFile: boolean;
  };
  seedRepoRootGuild: (params: { tempDir: GuildPath }) => Promise<{ guildPath: GuildPath }>;
  setup: (params: { tempDir: GuildPath; queueHarness: QueueHarness }) => {
    claudeQueueDir: FilePath;
    wardQueueDir: FilePath;
    restore: () => void;
  };
  withRestore: <T>(env: { restore: () => void }, fn: () => Promise<T>) => Promise<T>;
} => {
  let currentRestore: (() => void) | null = null;

  return {
    beforeEach: (): void => {
      if (currentRestore) {
        try {
          OrchestrationFlow.stopAll();
        } finally {
          currentRestore();
          currentRestore = null;
        }
      }
    },
    afterEach: (): void => {
      if (currentRestore) {
        try {
          OrchestrationFlow.stopAll();
        } finally {
          currentRestore();
          currentRestore = null;
        }
      }
    },
    setupHome: ({ tempDir }: { tempDir: GuildPath }): { restore: () => void } => {
      const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
      process.env.DUNGEONMASTER_HOME = tempDir;

      seedHomeFiles({ homeDir: tempDir });

      const restore = (): void => {
        if (savedDungeonmasterHome === undefined) {
          Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
        } else {
          process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
        }
      };

      currentRestore = restore;

      return { restore };
    },
    // The same files `setupHome` lays down, for a SECOND home the test reaches by handing its path
    // to a broker rather than by pointing DUNGEONMASTER_HOME at it. `config.json` in particular is
    // not optional here: `guildConfigReadBroker`'s ENOENT fallback tests `cause instanceof Error`,
    // and under jest the cause is an `fs/promises` error from outside the sandbox realm, so that
    // check reads false and the read throws instead of defaulting to `{ guilds: [] }`.
    //
    // Async because `ban-sync-seeding-methods` requires it of every `seed*` harness method. The
    // writes stay on the sync `seedHomeFiles` this shares with `setupHome`, which cannot itself
    // become async without changing every caller of the restore handle it returns inline.
    seedHome: async ({ tempDir }: { tempDir: GuildPath }): Promise<void> => {
      await Promise.resolve();
      seedHomeFiles({ homeDir: tempDir });
    },
    writeRepoRootMarker: async ({ repoRoot }: { repoRoot: GuildPath }): Promise<void> => {
      // Drop a `.dungeonmaster.json` at the repo root so cwdResolveBroker({ kind: 'repo-root' })
      // walking up from process.cwd() resolves to this directory.
      await fs.promises.mkdir(repoRoot, { recursive: true });
      await fs.promises.writeFile(path.join(repoRoot, '.dungeonmaster.json'), '{}');
    },
    seedQuestRepoPackages: async ({
      repoRoot,
      locations,
      sources = [],
    }: {
      repoRoot: GuildPath;
      locations: readonly string[];
      sources?: readonly string[];
    }): Promise<void> => {
      // Makes this testbed dir the repo a hydrated quest targets, holding the package roots that
      // quest declares. The `.dungeonmaster.json` marker pins cwdResolveBroker's walk-up from the
      // guild path here rather than to some ancestor of /tmp, and each declared location is
      // repo-relative to exactly that root — which is where questModifyBroker's write-time
      // existence check for an 'edit' entry looks.
      await fs.promises.mkdir(repoRoot, { recursive: true });
      await fs.promises.writeFile(path.join(repoRoot, '.dungeonmaster.json'), '{}');
      await Promise.all(
        locations.map(async (location) =>
          fs.promises.mkdir(path.resolve(repoRoot, location), { recursive: true }),
        ),
      );
      // `sources` are contract source paths the blueprint declares as already existing. They are
      // anchored on the same root for the same reason the locations are: questModifyBroker's
      // Contract Source Resolution check probes `<projectRoot>/<source>`, so a blueprint carrying
      // `status: 'existing'` is only honest in a testbed repo that actually holds the file.
      await Promise.all(
        sources.map(async (source) => {
          const sourcePath = path.resolve(repoRoot, source);
          await fs.promises.mkdir(path.dirname(sourcePath), { recursive: true });
          await fs.promises.writeFile(sourcePath, '');
        }),
      );
    },
    chdirInto: ({ dir }: { dir: GuildPath }): { restore: () => void } => {
      // questMcpCreateBroker reads process.cwd() verbatim via processCwdAdapter; chdir so the
      // real cwd walk-up anchors on this testbed dir, not the host repo.
      const savedCwd = process.cwd();
      process.chdir(dir);
      return {
        restore: (): void => {
          process.chdir(savedCwd);
        },
      };
    },
    makeAndChdir: ({ dir }: { dir: GuildPath }): { restore: () => void } => {
      // Create a nested subfolder (so create-quest can run from inside an ancestor guild) and
      // chdir into it; restore the original cwd afterwards.
      const savedCwd = process.cwd();
      fs.mkdirSync(dir, { recursive: true });
      process.chdir(dir);
      return {
        restore: (): void => {
          process.chdir(savedCwd);
        },
      };
    },
    readConfigGuilds: ({
      tempDir,
    }: {
      tempDir: GuildPath;
    }): readonly { name: GuildName; path: GuildPath; guildId: GuildId; urlSlug: UrlSlug }[] => {
      const raw = fs.readFileSync(path.join(tempDir, 'config.json'), 'utf-8');
      const parsed = JSON.parse(raw) as {
        guilds: { name: GuildName; path: GuildPath; id: GuildId; urlSlug: UrlSlug }[];
      };
      return parsed.guilds.map((guild) => ({
        name: guild.name,
        path: guild.path,
        guildId: guild.id,
        urlSlug: guild.urlSlug,
      }));
    },
    questsDirExists: ({ tempDir, guildId }: { tempDir: GuildPath; guildId: GuildId }): boolean =>
      fs.existsSync(path.join(tempDir, 'guilds', guildId, 'quests')),
    questFilePersisted: ({
      tempDir,
      guildId,
      questId,
    }: {
      tempDir: GuildPath;
      guildId: GuildId;
      questId: QuestId;
    }): { exists: boolean; questIdInFile: boolean } => {
      const questFilePath = path.join(tempDir, 'guilds', guildId, 'quests', questId, 'quest.json');
      const exists = fs.existsSync(questFilePath);
      const parsed = exists
        ? (JSON.parse(fs.readFileSync(questFilePath, 'utf-8')) as { id?: QuestId })
        : { id: undefined };
      return { exists, questIdInFile: parsed.id === questId };
    },
    seedRepoRootGuild: async ({
      tempDir,
    }: {
      tempDir: GuildPath;
    }): Promise<{ guildPath: GuildPath }> => {
      // Drop a `.dungeonmaster.json` at the testbed dir so cwdResolveBroker({ kind: 'repo-root' })
      // walks up from the home AND from the registered guild.path to the SAME repo root —
      // that's the equality smoketestEnsureGuildBroker requires before returning a guildId.
      fs.writeFileSync(path.join(tempDir, '.dungeonmaster.json'), '{}');
      const guildPath = guildPathContract.parse(tempDir);
      await guildAddBroker({
        name: GuildNameStub({ value: 'codex' }),
        path: guildPath,
      });
      return { guildPath };
    },

    setup: ({
      tempDir,
      queueHarness,
    }: {
      tempDir: GuildPath;
      queueHarness: QueueHarness;
    }): {
      claudeQueueDir: FilePath;
      wardQueueDir: FilePath;
      restore: () => void;
    } => {
      queueHarness.resetCounters();
      const { claudeQueueDir, wardQueueDir } = queueHarness.initDirs({ baseDir: tempDir });

      const savedClaudeCliPath = process.env.CLAUDE_CLI_PATH;
      const savedFakeClaudeQueueDir = process.env.FAKE_CLAUDE_QUEUE_DIR;
      const savedFakeWardQueueDir = process.env.FAKE_WARD_QUEUE_DIR;
      const savedPath = process.env.PATH;
      const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
      const savedWardCliPath = process.env.WARD_CLI_PATH;

      process.env.CLAUDE_CLI_PATH = FAKE_CLAUDE_CLI;
      process.env.FAKE_CLAUDE_QUEUE_DIR = String(claudeQueueDir);
      process.env.FAKE_WARD_QUEUE_DIR = String(wardQueueDir);
      process.env.PATH = `${FAKE_WARD_BIN_DIR}:${process.env.PATH ?? ''}`;
      process.env.WARD_CLI_PATH = FAKE_WARD_CLI;
      process.env.DUNGEONMASTER_HOME = tempDir;

      seedHomeFiles({ homeDir: tempDir });

      const restore = (): void => {
        process.env.CLAUDE_CLI_PATH = savedClaudeCliPath;
        process.env.FAKE_CLAUDE_QUEUE_DIR = savedFakeClaudeQueueDir;
        process.env.FAKE_WARD_QUEUE_DIR = savedFakeWardQueueDir;
        process.env.PATH = savedPath;
        if (savedWardCliPath === undefined) {
          Reflect.deleteProperty(process.env, 'WARD_CLI_PATH');
        } else {
          process.env.WARD_CLI_PATH = savedWardCliPath;
        }
        if (savedDungeonmasterHome === undefined) {
          Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
        } else {
          process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
        }
      };

      currentRestore = restore;

      return { claudeQueueDir, wardQueueDir, restore };
    },

    withRestore: async <T>(env: { restore: () => void }, fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } finally {
        OrchestrationFlow.stopAll();
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 250);
        });
        env.restore();
      }
    },
  };
};
